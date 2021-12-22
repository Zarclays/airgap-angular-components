import { SymbolInput, SymbolType } from '@zarclays/zgap-angular-core'

export interface CurrencySymbolState {
  src: string
  fallbackType?: SymbolType

  input: SymbolInput | undefined
  fallbackInput: SymbolInput | undefined
  inputs: SymbolInput[]
}
