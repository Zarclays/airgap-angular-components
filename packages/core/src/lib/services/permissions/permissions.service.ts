import { Injectable, Inject } from '@angular/core'
import { Diagnostic } from '@ionic-native/diagnostic/ngx'
import { Platform } from '@ionic/angular'
import { PermissionType, PermissionsPlugin } from '@capacitor/core'
import { UiEventElementsService } from '../ui-event-elements/ui-event-elements.service'
import { PERMISSIONS_PLUGIN } from '../../capacitor-plugins/injection-tokens'
// import { ErrorCategory, handleErrorLocal } from '../error-handler/error-handler.service'

export enum PermissionStatus {
  GRANTED = 'GRANTED',
  NOT_REQUESTED = 'NOT_REQUESTED',
  DENIED_ALWAYS = 'DENIED_ALWAYS',
  DENIED = 'DENIED',
  UNKNOWN = 'UNKNOWN'
}

export enum PermissionTypes {
  CAMERA = 'CAMERA',
  MICROPHONE = 'MICROPHONE'
}

@Injectable({
  providedIn: 'root'
})
export class PermissionsService {
  constructor(
    private readonly uiEventElementsService: UiEventElementsService,
    private readonly platform: Platform,
    private readonly diagnostic: Diagnostic,
    @Inject(PERMISSIONS_PLUGIN) private readonly permissions: PermissionsPlugin
  ) {}

  public async hasCameraPermission(): Promise<PermissionStatus> {
    return this.checkPermission(PermissionType.Camera)
  }

  public async hasMicrophonePermission(): Promise<PermissionStatus> {
    return this.checkPermission(PermissionType.Microphone)
  }

  public async hasNotificationsPermission(): Promise<PermissionStatus> {
    return this.checkPermission(PermissionType.Notifications)
  }

  public async requestPermissions(permissions: PermissionTypes[]): Promise<void> {
    if (this.platform.is('android')) {
      const permissionsToRequest: string[] = []
      if (permissions.indexOf(PermissionTypes.CAMERA) >= 0) {
        permissionsToRequest.push(this.diagnostic.permission.CAMERA)
      }
      if (permissions.indexOf(PermissionTypes.MICROPHONE) >= 0) {
        permissionsToRequest.push(this.diagnostic.permission.RECORD_AUDIO)
      }
      await this.diagnostic.requestRuntimePermissions(permissionsToRequest)
    } else if (this.platform.is('ios')) {
      if (permissions.indexOf(PermissionTypes.CAMERA) >= 0) {
        await this.diagnostic.requestCameraAuthorization(false)
      }
      if (permissions.indexOf(PermissionTypes.MICROPHONE) >= 0) {
        await this.diagnostic.requestMicrophoneAuthorization()
      }
    } else {
      console.warn('requesting permission in browser')
    }
  }

  /**
   * The user actively wants to give permissions. This means we first check if we
   * can ask him for the permissions natively, otherwise we show an alert with a
   * link to the settings.
   */
  public async userRequestsPermissions(permissions: PermissionTypes[]): Promise<void> {
    let canRequestPermission: boolean = false
    for (const p of permissions) {
      canRequestPermission = (await this.canAskForPermission(p)) || canRequestPermission
    }
    if (canRequestPermission) {
      await this.requestPermissions(permissions)
    } else {
      await this.uiEventElementsService.showOpenSettingsAlert(() => {
        this.diagnostic.switchToSettings().catch(console.error)
      })
    }
  }

  private async canAskForPermission(permission: PermissionTypes): Promise<boolean> {
    let canAskForPermission: boolean = true
    if (this.platform.is('android')) {
      if (permission === PermissionTypes.CAMERA) {
        const permissionStatus: PermissionStatus = await this.hasCameraPermission()
        canAskForPermission = !(permissionStatus === PermissionStatus.DENIED_ALWAYS)
      } else if (permission === PermissionTypes.MICROPHONE) {
        const permissionStatus: PermissionStatus = await this.hasMicrophonePermission()
        canAskForPermission = !(permissionStatus === PermissionStatus.DENIED_ALWAYS)
      }
    } else if (this.platform.is('ios')) {
      if (permission === PermissionTypes.CAMERA) {
        const permissionStatus: PermissionStatus = await this.hasCameraPermission()
        canAskForPermission = !(permissionStatus === PermissionStatus.DENIED)
      } else if (permission === PermissionTypes.MICROPHONE) {
        const permissionStatus: PermissionStatus = await this.hasMicrophonePermission()
        canAskForPermission = !(permissionStatus === PermissionStatus.DENIED)
      }
    }

    return canAskForPermission
  }

  private async checkPermission(type: PermissionType): Promise<PermissionStatus> {
    const permission = await this.permissions.query({ name: type })

    return this.getPermissionStatus(permission.state)
  }

  private async getPermissionStatus(permission: string): Promise<PermissionStatus> {
    if (this.isGranted(permission)) {
      return PermissionStatus.GRANTED
    } else if (this.isNotRequested(permission)) {
      return PermissionStatus.NOT_REQUESTED
    } else if (this.isDeniedAlways(permission)) {
      return PermissionStatus.DENIED_ALWAYS
    } else if (this.isDenied(permission)) {
      return PermissionStatus.DENIED
    } else {
      return PermissionStatus.UNKNOWN
    }
  }

  private isGranted(permission: string): boolean {
    return permission === this.diagnostic.permissionStatus.GRANTED || permission === this.diagnostic.permissionStatus.GRANTED_WHEN_IN_USE
  }

  private isNotRequested(permission: string): boolean {
    return permission === this.diagnostic.permissionStatus.NOT_REQUESTED
  }

  private isDeniedAlways(permission: string): boolean {
    return permission === this.diagnostic.permissionStatus.DENIED_ALWAYS || permission === this.diagnostic.permissionStatus.RESTRICTED
  }

  private isDenied(permission: string): boolean {
    return !(this.isGranted(permission) || this.isNotRequested(permission))
  }
}
