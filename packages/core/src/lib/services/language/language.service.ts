import { Injectable } from '@angular/core'
import { TranslateService } from '@ngx-translate/core'
import { SupportedLanguage } from '../../types/SupportedLanguage'

export interface LanguageServiceConfig {
  supportedLanguages: SupportedLanguage[]
  defaultLanguage: SupportedLanguage
  useBrowserLanguage?: boolean
}

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private static readonly defaultLanguage: SupportedLanguage = 'en'

  public get supportedLanguages(): string[] {
    return this.translateService.getLangs()
  }

  constructor(private readonly translateService: TranslateService) {}

  public async init(
    config: LanguageServiceConfig = {
      supportedLanguages: [LanguageService.defaultLanguage],
      defaultLanguage: LanguageService.defaultLanguage,
      useBrowserLanguage: true
    }
  ): Promise<void> {
    const supportedLanguages: SupportedLanguage[] = config.supportedLanguages
    const defaultLanguage: SupportedLanguage = config.defaultLanguage
    const useBrowserLanguage: boolean = config.useBrowserLanguage ?? true

    if (supportedLanguages.find((supported: SupportedLanguage) => supported === defaultLanguage) === undefined) {
      supportedLanguages.push(defaultLanguage)
    }

    this.translateService.addLangs(supportedLanguages)
    this.translateService.setDefaultLang(defaultLanguage)

    const language: string = useBrowserLanguage ? this.translateService.getBrowserLang().toLowerCase() : defaultLanguage

    return this.changeLanguage(language)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
  public loadTranslation(language: string, translation: any, merge: boolean = true): void {
    this.translateService.setTranslation(language, translation, merge)
  }

  public async changeLanguage(language: string): Promise<void> {
    return this.translateService.use(language).toPromise()
  }

  public isLanguageSupported(language: string): boolean {
    return this.supportedLanguages.find((supported: string) => supported === language) !== undefined
  }
}
