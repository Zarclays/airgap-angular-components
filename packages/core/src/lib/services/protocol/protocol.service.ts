import { Injectable } from '@angular/core'
import { ICoinProtocol, ProtocolNotSupported, AeternityProtocol, BitcoinProtocol, EthereumProtocol, GroestlcoinProtocol, TezosProtocol, CosmosProtocol, PolkadotProtocol, KusamaProtocol, ICoinSubProtocol, TezosKtProtocol, TezosBTC, GenericERC20 } from 'airgap-coin-lib'
import { ProtocolNetwork } from 'airgap-coin-lib/dist/utils/ProtocolNetwork'
import { ProtocolSymbols, SubProtocolSymbols } from 'airgap-coin-lib/dist/utils/ProtocolSymbols'
import { getProtocolOptionsByIdentifier } from 'airgap-coin-lib/dist/utils/protocolOptionsByIdentifier'
import { isNetworkEqual } from 'airgap-coin-lib/dist/utils/Network'
import { EthereumERC20ProtocolOptions, EthereumProtocolNetwork, EthereumERC20ProtocolConfig } from 'airgap-coin-lib/dist/protocols/ethereum/EthereumProtocolOptions'
import { getProtocolAndNetworkIdentifier } from '../../utils/protocol/protocol-network-identifier'
import { createNotInitialized } from '../../utils/not-initialized'
import { Token } from '../../types/Token'
import { ethTokens } from './tokens'

interface SubProtocolsMap {
  [key: string]: {
    [subProtocolIdentifier in SubProtocolSymbols]?: ICoinSubProtocol
  }
}

export interface ProtocolServiceConfig {
  passiveProtocols?: ICoinProtocol[]
  activeProtocols?: ICoinProtocol[]

  passiveSubProtocols?: [ICoinProtocol, ICoinSubProtocol][]
  activeSubProtocols?: [ICoinProtocol, ICoinSubProtocol][]

  extraPassiveProtocols?: ICoinProtocol[]
  extraActiveProtocols?: ICoinProtocol[]

  extraPassiveSubProtocols?: [ICoinProtocol, ICoinSubProtocol][]
  extraActiveSubProtocols?: [ICoinProtocol, ICoinSubProtocol][]
}

const notInitialized = createNotInitialized('ProtocolService', 'Call `init` first.')

@Injectable({
  providedIn: 'root'
})
export class ProtocolService {
  private _passiveProtocols: ICoinProtocol[] | undefined
  private _activeProtocols: ICoinProtocol[] | undefined

  private _passiveSubProtocols: SubProtocolsMap | undefined
  private _activeSubProtocols: SubProtocolsMap | undefined
  
  public get passiveProtocols(): ICoinProtocol[] {
    return this._passiveProtocols ?? notInitialized()
  }

  public get activeProtocols(): ICoinProtocol[] {
    return this._activeProtocols ?? notInitialized()
  }

  public get passiveSubProtocols(): SubProtocolsMap {
    return this._passiveSubProtocols ?? notInitialized()
  }

  public get activeSubProtocols(): SubProtocolsMap {
    return this._activeSubProtocols ?? notInitialized()
  }

  public init(config?: ProtocolServiceConfig): void {
    this._passiveProtocols = config?.passiveProtocols ?? this.getDefaultPassiveProtocols()
    this._activeProtocols = config?.activeProtocols ?? this.getDefaultActiveProtocols()

    this._passiveSubProtocols = this.createSubProtocolMap(config?.passiveSubProtocols ?? this.getDefaultPassiveSubProtocols())
    this._activeSubProtocols = this.createSubProtocolMap(config?.activeSubProtocols ?? this.getDefaultActiveSubProtocols())

    if (config?.extraPassiveProtocols !== undefined) {
      this._passiveProtocols.push(...config.extraPassiveProtocols)
    }

    if (config?.extraActiveProtocols !== undefined) {
      this._activeProtocols.push(...config.extraActiveProtocols)
    }

    if (config?.extraPassiveSubProtocols !== undefined) {
      this._passiveSubProtocols = this.mergeSubProtocolMaps(this.passiveSubProtocols, config.extraPassiveSubProtocols)
    }

    if (config?.extraActiveSubProtocols !== undefined) {
      this._activeSubProtocols = this.mergeSubProtocolMaps(this.activeSubProtocols, config.extraActiveSubProtocols)
    }

    this.removeProtocolDuplicates()
    this.removeSubProtocolDuplicates()
  }

  public getProtocol(protocolOrIdentifier: ICoinProtocol | ProtocolSymbols, network?: ProtocolNetwork, supportedOnly: boolean = true): ICoinProtocol | undefined {
    try {
      return typeof protocolOrIdentifier === 'string' 
        ? this.getProtocolByIdentifier(protocolOrIdentifier, network, supportedOnly) 
        : protocolOrIdentifier
    } catch (error) {
      return undefined
    }
  }

  public getProtocolByIdentifier(identifier: ProtocolSymbols, network?: ProtocolNetwork, activeOnly: boolean = true): ICoinProtocol {
    const targetNetwork: ProtocolNetwork = network ?? getProtocolOptionsByIdentifier(identifier, network).network
    const filtered: ICoinProtocol[] = (activeOnly ? this.activeProtocols : this.activeProtocols.concat(this.passiveProtocols))
      .map((protocol: ICoinProtocol) => [protocol, ...(protocol.subProtocols ?? [])])
      .reduce((flatten: ICoinProtocol[], toFlatten: ICoinProtocol[]) => flatten.concat(toFlatten), [])
      .filter((protocol: ICoinProtocol) => protocol.identifier.startsWith(identifier) && isNetworkEqual(protocol.options.network, targetNetwork))

    if (filtered.length === 0) {
      throw new ProtocolNotSupported()
    }

    return filtered.sort((a: ICoinProtocol, b: ICoinProtocol) => a.identifier.length - b.identifier.length)[0]
  }

  public getSubProtocolsByIdentifier(identifier: ProtocolSymbols, network?: ProtocolNetwork, activeOnly: boolean = true): ICoinSubProtocol[] {
    const targetNetwork: ProtocolNetwork = network ?? getProtocolOptionsByIdentifier(identifier, network).network
    const protocolAndNetworkIdentifier: string = getProtocolAndNetworkIdentifier(identifier, targetNetwork)

    const subProtocolMap: SubProtocolsMap = activeOnly ? this.activeSubProtocols : this.mergeSubProtocolMaps(this.activeSubProtocols, this.passiveSubProtocols)

    if (subProtocolMap[protocolAndNetworkIdentifier] === undefined) {
      return []
    }

    return Object.values(subProtocolMap[protocolAndNetworkIdentifier] ?? {}).filter((subProtocol: ICoinSubProtocol | undefined) => subProtocol !== undefined) as ICoinSubProtocol[]
  }

  private getDefaultPassiveProtocols(): ICoinProtocol[] {
    return []
  }

  private getDefaultActiveProtocols(): ICoinProtocol[] {
    return [
      new AeternityProtocol(),
      new BitcoinProtocol(),
      new EthereumProtocol(),
      new GroestlcoinProtocol(),
      new TezosProtocol(),
      new CosmosProtocol(),
      new PolkadotProtocol(),
      new KusamaProtocol()
    ]
  }

  private getDefaultPassiveSubProtocols(): [ICoinProtocol, ICoinSubProtocol][] {
    return []
  }

  private getDefaultActiveSubProtocols(): [ICoinProtocol, ICoinSubProtocol][] {
    return [
      [new TezosProtocol(), new TezosKtProtocol()],
      [new TezosProtocol(), new TezosBTC()],
      ...ethTokens.map((token: Token) => [
        new EthereumProtocol(),
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
      ] as [EthereumProtocol, GenericERC20])
    ]
  }

  private createSubProtocolMap(protocols: [ICoinProtocol, ICoinSubProtocol][]): SubProtocolsMap {
    const subProtocolMap: SubProtocolsMap = {}

    protocols.forEach(([protocol, subProtocol]: [ICoinProtocol, ICoinSubProtocol]) => {
      if (!subProtocol.identifier.startsWith(protocol.identifier)) {
        throw new Error(`Sub protocol ${subProtocol.name} is not supported for protocol ${protocol.identifier}.`)
      }

      if (!isNetworkEqual(protocol.options.network, subProtocol.options.network)) {
        throw new Error(`Sub protocol ${subProtocol.name} must have the same network as the main protocol.`)
      }

      const protocolAndNetworkIdentifier: string = getProtocolAndNetworkIdentifier(protocol)

      if (subProtocolMap[protocolAndNetworkIdentifier] === undefined) {
        subProtocolMap[protocolAndNetworkIdentifier] = {}
      }

      subProtocolMap[protocolAndNetworkIdentifier][subProtocol.identifier as SubProtocolSymbols] = subProtocol
    })

    return subProtocolMap
  }

  private mergeSubProtocolMaps(first: [ICoinProtocol, ICoinSubProtocol][] | SubProtocolsMap, second: [ICoinProtocol, ICoinSubProtocol][] | SubProtocolsMap): SubProtocolsMap {
    if (Array.isArray(first) && Array.isArray(second)) {
      return this.createSubProtocolMap(first.concat(second))
    }

    const firstMap: SubProtocolsMap = Array.isArray(first) ? this.createSubProtocolMap(first) : first
    const secondMap: SubProtocolsMap = Array.isArray(second) ? this.createSubProtocolMap(second) : second

    const mergedMap: SubProtocolsMap = {}

    Object.entries(firstMap).concat(Object.entries(secondMap)).forEach(([protocolAndNetworkIdentifier, subProtocols]: [string, { [subProtocolIdentifier in SubProtocolSymbols]?: ICoinSubProtocol }]) => {
      if (mergedMap[protocolAndNetworkIdentifier] === undefined) {
        mergedMap[protocolAndNetworkIdentifier] = subProtocols
      } else {
        mergedMap[protocolAndNetworkIdentifier] = {
          ...mergedMap[protocolAndNetworkIdentifier],
          ...subProtocols
        }
      }
    })

    return mergedMap
  }

  private removeProtocolDuplicates(): void {
    // if a protocol has been set as passive and active, it's considered active
    const activeIdentifiers: string[] = this.activeProtocols.map((protocol: ICoinProtocol) => protocol.identifier)
    this._passiveProtocols = this.passiveProtocols.filter((protocol: ICoinProtocol) => !activeIdentifiers.includes(protocol.identifier))
  }

  private removeSubProtocolDuplicates(): void {
    // if a sub protocol has been set as passive and active, it's considered active
    const passiveEntries: [string, SubProtocolSymbols][] = Object.entries(this.passiveSubProtocols)
      .map(([protocolAndNetworkIdentifier, subProtocols]: [string, { [subProtocolIdentifier in SubProtocolSymbols]?: ICoinSubProtocol }]) =>
        Object.keys(subProtocols).map((subProtocol: string) => [protocolAndNetworkIdentifier, subProtocol] as [string, SubProtocolSymbols])
      )
      .reduce((flatten: [string, SubProtocolSymbols][], toFlatten: [string, SubProtocolSymbols][]) => flatten.concat(toFlatten), [])

    const filtered: SubProtocolsMap = {}

    passiveEntries.forEach(([protocolAndNetworkIdentifier, subProtocolIdentifier]: [string, SubProtocolSymbols]) => {
      if (this.activeSubProtocols[protocolAndNetworkIdentifier] === undefined || this.activeSubProtocols[protocolAndNetworkIdentifier][subProtocolIdentifier] === undefined) {
        if (filtered[protocolAndNetworkIdentifier] === undefined) {
          filtered[protocolAndNetworkIdentifier] = {}
        }

        filtered[protocolAndNetworkIdentifier][subProtocolIdentifier] = this.passiveSubProtocols[protocolAndNetworkIdentifier][subProtocolIdentifier]
      }
    })

    this._passiveSubProtocols = filtered
  }

  
}
