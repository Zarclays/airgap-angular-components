import { Component, Input } from '@angular/core'
import { ProtocolNetwork, NetworkType } from '@airgap/coinlib-core'

@Component({
  selector: 'airgap-network-badge',
  templateUrl: './network-badge.component.html',
  styleUrls: ['./network-badge.component.scss']
})
export class NetworkBadgeComponent {
  @Input()
  public readonly network: ProtocolNetwork | undefined

  public readonly networkType: typeof NetworkType = NetworkType
}
