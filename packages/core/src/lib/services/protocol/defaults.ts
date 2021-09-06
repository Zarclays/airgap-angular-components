import {
  ICoinProtocol,
  AeternityProtocol,
  BitcoinProtocol,
  EthereumProtocol,
  GroestlcoinProtocol,
  TezosProtocol,
  CosmosProtocol,
  PolkadotProtocol,
  KusamaProtocol,
  ICoinSubProtocol,
  TezosKtProtocol,
  GenericERC20,
  EthereumERC20ProtocolOptions,
  EthereumProtocolNetwork,
  EthereumERC20ProtocolConfig,
  TezosUUSD,
  RSKProtocol,
  RSKTestnetProtocol,
  TezosYOU,
  TezosBTC,
  TezosUSD,
  SubProtocolSymbols,
  MoonriverProtocol,
} from '@zarclays/zgap-coinlib-core'
import { Token } from '../../types/Token'
import { ethTokens } from './tokens'

export function getDefaultPassiveProtocols(): ICoinProtocol[] {
  return []
}

export function getDefaultActiveProtocols(): ICoinProtocol[] {
  return [
    new AeternityProtocol(),
    new BitcoinProtocol(),
    new EthereumProtocol(),
    new GroestlcoinProtocol(),
    new TezosProtocol(),
    new RSKProtocol(),
    new RSKTestnetProtocol(),
    new CosmosProtocol(),
    new PolkadotProtocol(),
    new KusamaProtocol(),
    new MoonriverProtocol()
  ]
}

export function getDefaultPassiveSubProtocols(): [ICoinProtocol, ICoinSubProtocol][] {
  return []
}

export function getDefaultActiveSubProtocols(): [ICoinProtocol, ICoinSubProtocol][] {
  const tezosProtocol = new TezosProtocol()
  const ethereumProtocol = new EthereumProtocol()

  return [
    [tezosProtocol, new TezosUUSD()],
    [tezosProtocol, new TezosYOU()],
    [tezosProtocol, new TezosBTC()],
    [tezosProtocol, new TezosUSD()],
    [tezosProtocol, new TezosKtProtocol()],
    ...ethTokens.map(
      (token: Token) =>
        [
          ethereumProtocol,
          new GenericERC20(
            new EthereumERC20ProtocolOptions(
              new EthereumProtocolNetwork(),
              new EthereumERC20ProtocolConfig(
                token.symbol,
                token.name,
                token.marketSymbol,
                token.identifier as SubProtocolSymbols,
                token.contractAddress,
                token.decimals
              )
            )
          )
        ] as [EthereumProtocol, GenericERC20]
    )
  ]
}
