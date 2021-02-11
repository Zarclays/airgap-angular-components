import { Injectable } from '@angular/core'
import { generateId, IACMessageDefinitionObject, IACMessageType, Serializer } from '@airgap/coinlib-core'
import { DeserializedSyncProtocol, EncodedType, SyncProtocolUtils } from '@airgap/coinlib-core/serializer/v1/serializer'
import BigNumber from 'bignumber.js'

import { MainProtocolSymbols } from '@airgap/coinlib-core/utils/ProtocolSymbols'
import { parseIACUrl } from '../../utils/utils'
import { InternalStorageKey, InternalStorageService } from '../storage/storage.service'

export enum SerializerDefaults {
  SINGLE = 350,
  MULTI = 100,
  TIME = 500
}
@Injectable({
  providedIn: 'root'
})
export class SerializerService {
  private readonly syncProtocolUtils: SyncProtocolUtils = new SyncProtocolUtils()
  private readonly serializer: Serializer = new Serializer()

  private readonly v1Tov2Mapping: Map<EncodedType, IACMessageType> = new Map<EncodedType, IACMessageType>()
  private readonly v2Tov1Mapping: Map<IACMessageType, EncodedType> = new Map<IACMessageType, EncodedType>()

  private _useV2: boolean = true
  public _singleChunkSize: number = SerializerDefaults.SINGLE
  public _multiChunkSize: number = SerializerDefaults.MULTI
  private _displayTimePerChunk: number = SerializerDefaults.TIME

  public get useV2(): boolean {
    return this._useV2
  }

  public set useV2(value: boolean) {
    // eslint-disable-next-line no-console
    this.internalStorageService.set(InternalStorageKey.SETTINGS_SERIALIZER_ENABLE_V2, value).catch(console.error)
    this._useV2 = value
  }

  public get singleChunkSize(): number {
    return this._singleChunkSize
  }

  public set singleChunkSize(value: number) {
    // eslint-disable-next-line no-console
    this.internalStorageService.set(InternalStorageKey.SETTINGS_SERIALIZER_SINGLE_CHUNK_SIZE, value).catch(console.error)
    this._singleChunkSize = value
  }

  public get multiChunkSize(): number {
    return this._multiChunkSize
  }

  public set multiChunkSize(value: number) {
    // eslint-disable-next-line no-console
    this.internalStorageService.set(InternalStorageKey.SETTINGS_SERIALIZER_MULTI_CHUNK_SIZE, value).catch(console.error)
    this._multiChunkSize = value
  }

  public get displayTimePerChunk(): number {
    return this._displayTimePerChunk
  }

  public set displayTimePerChunk(value: number) {
    // eslint-disable-next-line no-console
    this.internalStorageService.set(InternalStorageKey.SETTINGS_SERIALIZER_CHUNK_TIME, value).catch(console.error)
    this._displayTimePerChunk = value
  }

  constructor(private readonly internalStorageService: InternalStorageService) {
    this.useV2 = true
    this.v1Tov2Mapping.set(EncodedType.WALLET_SYNC, IACMessageType.AccountShareResponse) // AccountShareResponse
    this.v1Tov2Mapping.set(EncodedType.UNSIGNED_TRANSACTION, IACMessageType.TransactionSignRequest) // TransactionSignRequest
    this.v1Tov2Mapping.set(EncodedType.SIGNED_TRANSACTION, IACMessageType.TransactionSignResponse) // TransactionSignResponse

    Array.from(this.v1Tov2Mapping.entries()).forEach((value: [EncodedType, number]) => {
      this.v2Tov1Mapping.set(value[1], value[0])
    })

    // eslint-disable-next-line no-console
    this.loadSettings().catch(console.error)
  }

  public resetSettings() {
    this._singleChunkSize = SerializerDefaults.SINGLE
    this.internalStorageService.set(InternalStorageKey.SETTINGS_SERIALIZER_SINGLE_CHUNK_SIZE, SerializerDefaults.SINGLE)
    this._multiChunkSize = SerializerDefaults.MULTI
    this.internalStorageService.set(InternalStorageKey.SETTINGS_SERIALIZER_MULTI_CHUNK_SIZE, SerializerDefaults.MULTI)
    this._displayTimePerChunk = SerializerDefaults.TIME
  }

  public async serialize(chunks: IACMessageDefinitionObject[]): Promise<string[]> {
    if (
      !this.useV2 &&
      !chunks.some(
        (chunk: IACMessageDefinitionObject) =>
          chunk.protocol === MainProtocolSymbols.COSMOS ||
          chunk.protocol === MainProtocolSymbols.KUSAMA ||
          chunk.protocol === MainProtocolSymbols.POLKADOT ||
          chunk.protocol === MainProtocolSymbols.GRS
      )
    ) {
      if (chunks[0].protocol === MainProtocolSymbols.BTC && chunks[0].type === 6) {
        // This expects a BigNumber, but we now have a string. So we need to convert it.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const legacyPayload: any = chunks[0].payload
        legacyPayload.amount = new BigNumber(legacyPayload.amount)
        legacyPayload.fee = new BigNumber(legacyPayload.fee)
      }

      return [await this.serializeV1(chunks[0])]
    } else {
      return this.serializeV2(chunks)
    }
  }

  public async deserialize(chunks: string | string[]): Promise<IACMessageDefinitionObject[]> {
    const parsedChunks: string[] = parseIACUrl(chunks, 'd')
    try {
      return await this.deserializeV2(parsedChunks)
    } catch (error) {
      if (error && error.availablePages && error.totalPages) {
        throw error
      }

      return [await this.deserializeV1(parsedChunks[0])]
    }
  }

  private async loadSettings() {
    this.internalStorageService
      .get(InternalStorageKey.SETTINGS_SERIALIZER_ENABLE_V2)
      .then((setting) => (this._useV2 = setting))
      // eslint-disable-next-line no-console
      .catch(console.error)
    this.internalStorageService
      .get(InternalStorageKey.SETTINGS_SERIALIZER_CHUNK_TIME)
      .then((setting) => (this._displayTimePerChunk = setting))
      // eslint-disable-next-line no-console
      .catch(console.error)
    this.internalStorageService
      .get(InternalStorageKey.SETTINGS_SERIALIZER_SINGLE_CHUNK_SIZE)
      .then((setting) => (this._singleChunkSize = setting))
      // eslint-disable-next-line no-console
      .catch(console.error)
    this.internalStorageService
      .get(InternalStorageKey.SETTINGS_SERIALIZER_MULTI_CHUNK_SIZE)
      .then((setting) => (this._multiChunkSize = setting))
      // eslint-disable-next-line no-console
      .catch(console.error)
  }

  private async serializeV1(chunk: IACMessageDefinitionObject): Promise<string> {
    const v1Type: EncodedType | undefined = this.v2Tov1Mapping.get(chunk.type)

    if (v1Type === undefined) {
      throw new Error(`Serializer V1 type not supported (${chunk.type})`)
    }

    const chunkToSerialize: DeserializedSyncProtocol = {
      type: v1Type,
      protocol: chunk.protocol,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      payload: chunk.payload as any
    }

    return this.syncProtocolUtils.serialize(chunkToSerialize)
  }

  private async serializeV2(chunks: IACMessageDefinitionObject[]): Promise<string[]> {
    return this.serializer.serialize(chunks, this.singleChunkSize, this.multiChunkSize)
  }

  private async deserializeV1(chunk: string): Promise<IACMessageDefinitionObject> {
    const deserialized: DeserializedSyncProtocol = await this.syncProtocolUtils.deserialize(chunk)

    const v2Type: IACMessageType | undefined = this.v1Tov2Mapping.get(deserialized.type)

    if (v2Type === undefined) {
      throw new Error(`Serializer V2 type not supported (${deserialized.type})`)
    }

    const iacMessage: IACMessageDefinitionObject = {
      id: generateId(10),
      type: v2Type,
      protocol: deserialized.protocol,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      payload: deserialized.payload as any
    }

    return iacMessage
  }

  private async deserializeV2(chunks: string[]): Promise<IACMessageDefinitionObject[]> {
    return this.serializer.deserialize(chunks)
  }
}
