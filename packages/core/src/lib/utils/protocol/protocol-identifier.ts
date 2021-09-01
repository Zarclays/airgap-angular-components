import { ProtocolSymbols, MainProtocolSymbols } from '@zarclays/zgap-coinlib-core'

export function getMainIdentifier(subIdentifier: ProtocolSymbols): MainProtocolSymbols {
  return subIdentifier.split('-')[0] as MainProtocolSymbols
}
