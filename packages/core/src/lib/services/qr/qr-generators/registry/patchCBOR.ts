const CBOR = require('./lib/cbor-sync')
import { DataItem } from './lib/DataItem'
import { RegistryTypes } from './RegistryType'
import { ScriptExpressions } from './ScriptExpression'

const alreadyPatchedTag = []

const patchTags = (tags: number[]) => {
  tags.forEach((tag) => {
    if (alreadyPatchedTag.find((i) => i === tag)) return
    CBOR.addSemanticEncode(tag, (data: any) => {
      if (data instanceof DataItem) {
        if (data.getTag() === tag) {
          return data.getData()
        }
      }
    })
    CBOR.addSemanticDecode(tag, (data: any) => {
      return new DataItem(data, tag)
    })
    alreadyPatchedTag.push(tag)
  })
}

const registryTags = Object.values(RegistryTypes)
  .filter((r) => !!r.getTag())
  .map((r) => r.getTag())
const scriptExpressionTags = Object.values(ScriptExpressions).map((se) => se.getTag())
patchTags(registryTags.concat(scriptExpressionTags))
