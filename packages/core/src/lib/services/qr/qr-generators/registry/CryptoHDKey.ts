import { CryptoCoinInfo } from './CryptoCoinInfo'
import { CryptoKeypath } from './CryptoKeypath'
import { CBOR } from './lib/cbor-sync'
import { DataItem } from './lib/DataItem'
import { RegistryItem } from './RegistryItem'
import { RegistryTypes } from './RegistryType'

enum Keys {
  is_master = 1,
  is_private,
  key_data,
  chain_code,
  use_info,
  origin,
  children,
  parent_fingerprint,
  name,
  note
}

type MasterKeyProps = {
  isMaster: true
  key: Buffer
  chainCode: Buffer
}

type DeriveKeyProps = {
  isMaster: false
  isPrivateKey?: boolean
  key: Buffer
  chainCode?: Buffer
  useInfo?: CryptoCoinInfo
  origin?: CryptoKeypath
  children?: CryptoKeypath
  parentFingerprint?: Buffer
  name?: string
  note?: string
}
export class CryptoHDKey extends RegistryItem {
  private master: boolean
  private privateKey: boolean
  private key: Buffer
  private chainCode: Buffer
  private useInfo: CryptoCoinInfo
  private origin: CryptoKeypath
  private children: CryptoKeypath
  private parentFingerprint: Buffer
  private name: string
  private note: string

  public getKey = () => this.key
  public getChainCode = () => this.chainCode
  public isMaster = () => this.master
  public isPrivateKey = () => !!this.privateKey
  public getUseInfo = () => this.useInfo
  public getOrigin = () => this.origin
  public getChildren = () => this.children
  public getParentFingerprint = () => this.parentFingerprint
  public getName = () => this.name
  public getNote = () => this.note

  public getRegistryType = () => {
    return RegistryTypes.CRYPTO_HDKEY
  }

  constructor(args: DeriveKeyProps | MasterKeyProps) {
    super()
    if (args.isMaster) {
      this.setupMasterKey(args)
    } else {
      this.setupDeriveKey(args as DeriveKeyProps)
    }
  }

  private setupMasterKey = (args: MasterKeyProps) => {
    this.master = true
    this.key = args.key
    this.chainCode = args.chainCode
  }

  private setupDeriveKey = (args: DeriveKeyProps) => {
    this.master = false
    this.privateKey = args.isPrivateKey
    this.key = args.key
    this.chainCode = args.chainCode
    this.useInfo = args.useInfo
    this.origin = args.origin
    this.children = args.children
    this.parentFingerprint = args.parentFingerprint
    this.name = args.name
    this.note = args.note
  }

  public toDataItem = () => {
    const map = {}
    if (this.master) {
      map[Keys.is_master] = true
      map[Keys.key_data] = this.key
      map[Keys.chain_code] = this.chainCode
    } else {
      if (this.privateKey !== undefined) {
        map[Keys.is_private] = this.privateKey
      }
      map[Keys.key_data] = this.key
      if (this.chainCode) {
        map[Keys.chain_code] = this.chainCode
      }
      if (this.useInfo) {
        const useInfo = this.useInfo.toDataItem()
        useInfo.setTag(this.useInfo.getRegistryType().getTag())
        map[Keys.use_info] = useInfo
      }
      if (this.origin) {
        const origin = this.origin.toDataItem()
        origin.setTag(this.origin.getRegistryType().getTag())
        map[Keys.origin] = origin
      }
      if (this.children) {
        const children = this.children.toDataItem()
        children.setTag(this.children.getRegistryType().getTag())
        map[Keys.children] = children
      }
      if (this.parentFingerprint) {
        map[Keys.parent_fingerprint] = this.parentFingerprint.readUInt32BE(0)
      }
      if (this.name !== undefined) {
        map[Keys.name] = this.name
      }
      if (this.note !== undefined) {
        map[Keys.note] = this.note
      }
    }
    return new DataItem(map)
  }

  public static fromDataItem = (dataItem: DataItem) => {
    const map = dataItem.getData()
    const isMaster = !!map[Keys.is_master]
    const isPrivateKey = map[Keys.is_private]
    const key = map[Keys.key_data]
    const chainCode = map[Keys.chain_code]
    const useInfo = map[Keys.use_info] ? CryptoCoinInfo.fromDataItem(map[Keys.use_info]) : undefined
    const origin = map[Keys.origin] ? CryptoKeypath.fromDataItem(map[Keys.origin]) : undefined
    const children = map[Keys.children] ? CryptoKeypath.fromDataItem(map[Keys.children]) : undefined
    let _parentFingerprint = map[Keys.parent_fingerprint]
    let parentFingerprint: Buffer
    if (_parentFingerprint) {
      parentFingerprint = Buffer.alloc(4)
      parentFingerprint.writeUInt32BE(_parentFingerprint, 0)
    }
    const name = map[Keys.name]
    const note = map[Keys.note]

    return new CryptoHDKey({
      isMaster,
      isPrivateKey,
      key,
      chainCode,
      useInfo,
      origin,
      children,
      parentFingerprint,
      name,
      note
    })
  }

  public static fromCBOR = (_cborPayload: Buffer) => {
    const dataItem = CBOR.decodeToDataItem(_cborPayload)
    return CryptoHDKey.fromDataItem(dataItem)
  }
}
