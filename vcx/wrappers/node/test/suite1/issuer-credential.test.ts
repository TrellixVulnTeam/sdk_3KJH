import { assert } from 'chai'
import {
  connectionCreateConnect,
  dataIssuerCredentialCreate,
  issuerCredentialCreate
} from 'helpers/entities'
import { gcTest } from 'helpers/gc'
import { TIMEOUT_GC } from 'helpers/test-constants'
import { initVcxTestMode, shouldThrow } from 'helpers/utils'
import { Connection, IssuerCredential, rustAPI, StateType, VCXCode, VCXMock, VCXMockMessage } from 'src'

describe('IssuerCredential:', () => {
  before(() => initVcxTestMode())

  describe('create:', () => {
    it('success', async () => {
      await issuerCredentialCreate()
    })

    it('throws: missing sourceId', async () => {
      const { sourceId, ...data } = await dataIssuerCredentialCreate()
      const error = await shouldThrow(() => IssuerCredential.create(data as any))
      assert.equal(error.vcxCode, VCXCode.INVALID_OPTION)
    })

    it('throws: missing credDefId', async () => {
      const { credDefId, ...data } = await dataIssuerCredentialCreate()
      const error = await shouldThrow(() => IssuerCredential.create(data as any))
      assert.equal(error.vcxCode, VCXCode.INVALID_OPTION)
    })

    it('throws: missing credDefId', async () => {
      const { credDefId, ...data } = await dataIssuerCredentialCreate()
      const error = await shouldThrow(() => IssuerCredential.create(data as any))
      assert.equal(error.vcxCode, VCXCode.INVALID_OPTION)
    })

    it('throws: missing attr', async () => {
      const { attr, ...data } = await dataIssuerCredentialCreate()
      const error = await shouldThrow(() => IssuerCredential.create(data as any))
      assert.equal(error.vcxCode, VCXCode.INVALID_OPTION)
    })

    it('throws: missing credentialName', async () => {
      const { credentialName, ...data } = await dataIssuerCredentialCreate()
      const error = await shouldThrow(() => IssuerCredential.create(data as any))
      assert.equal(error.vcxCode, VCXCode.INVALID_OPTION)
    })

    it('throws: missing price', async () => {
      const { price, ...data } = await dataIssuerCredentialCreate()
      const error = await shouldThrow(() => IssuerCredential.create(data as any))
      assert.equal(error.vcxCode, VCXCode.INVALID_OPTION)
    })

    it('throws: invalid attr', async () => {
      const { attr, ...data } = await dataIssuerCredentialCreate()
      const error = await shouldThrow(() => IssuerCredential.create({ attr: 'invalid' as any, ...data }))
      assert.equal(error.vcxCode, VCXCode.INVALID_JSON)
    })
  })

  describe('serialize:', () => {
    it('success', async () => {
      const issuerCredential = await issuerCredentialCreate()
      const data = await issuerCredential.serialize()
      assert.ok(data)
      assert.equal(data.source_id, issuerCredential.sourceId)
    })

    it('throws: not initialized', async () => {
      const issuerCredential = new (IssuerCredential as any)()
      const error = await shouldThrow(() => issuerCredential.serialize())
      assert.equal(error.vcxCode, VCXCode.INVALID_CREDENTIAL_HANDLE)
      assert.equal(error.vcxFunction, 'IssuerCredential:serialize')
      assert.equal(error.message, 'Invalid Issuer Credential Handle')
    })

    it('throws: issuerCredential released', async () => {
      const issuerCredential = await issuerCredentialCreate()
      const data = await issuerCredential.serialize()
      assert.ok(data)
      assert.equal(data.source_id, issuerCredential.sourceId)
      assert.equal(await issuerCredential.release(), VCXCode.SUCCESS)
      const error = await shouldThrow(() => issuerCredential.serialize())
      assert.equal(error.vcxCode, VCXCode.INVALID_CREDENTIAL_HANDLE)
      assert.equal(error.vcxFunction, 'IssuerCredential:serialize')
      assert.equal(error.message, 'Invalid Issuer Credential Handle')
    })
  })

  describe('deserialize:', () => {
    it('success', async () => {
      const issuerCredential1 = await issuerCredentialCreate()
      const data1 = await issuerCredential1.serialize()
      const issuerCredential2 = await IssuerCredential.deserialize(data1)
      assert.equal(issuerCredential2.sourceId, issuerCredential1.sourceId)
      const data2 = await issuerCredential2.serialize()
      assert.deepEqual(data1, data2)
    })

    it('throws: incorrect data', async () => {
      const error = await shouldThrow(async () => IssuerCredential.deserialize({ source_id: 'Invalid' } as any))
      assert.equal(error.vcxCode, VCXCode.INVALID_JSON)
      assert.equal(error.vcxFunction, 'IssuerCredential:_deserialize')
      assert.equal(error.message, 'Invalid JSON string')
    })
  })

  describe('release:', () => {
    it('success', async () => {
      const issuerCredential = await issuerCredentialCreate()
      assert.equal(await issuerCredential.release(), VCXCode.SUCCESS)
      const errorSerialize = await shouldThrow(() => issuerCredential.serialize())
      assert.equal(errorSerialize.vcxCode, VCXCode.INVALID_CREDENTIAL_HANDLE)
      assert.equal(errorSerialize.vcxFunction, 'IssuerCredential:serialize')
      assert.equal(errorSerialize.message, 'Invalid Issuer Credential Handle')
    })

    it('throws: not initialized', async () => {
      const issuerCredential = new (IssuerCredential as any)()
      const error = await shouldThrow(() => issuerCredential.release())
      assert.equal(error.vcxCode, VCXCode.UNKNOWN_ERROR)
    })
  })

  describe('updateState:', () => {
    it(`returns ${StateType.None}: not initialized`, async () => {
      const issuerCredential = new (IssuerCredential as any)()
      await issuerCredential.updateState()
      assert.equal(await issuerCredential.getState(), StateType.None)
    })

    it(`returns ${StateType.Initialized}: created`, async () => {
      const issuerCredential = await issuerCredentialCreate()
      await issuerCredential.updateState()
      assert.equal(await issuerCredential.getState(), StateType.Initialized)
    })
  })

  describe('sendOffer:', () => {
    it('success', async () => {
      const connection = await connectionCreateConnect()
      const issuerCredential = await issuerCredentialCreate()
      await issuerCredential.sendOffer(connection)
      assert.equal(await issuerCredential.getState(), StateType.OfferSent)
    })

    it('throws: not initialized', async () => {
      const connection = await connectionCreateConnect()
      const issuerCredential = new (IssuerCredential as any)()
      const error = await shouldThrow(() => issuerCredential.sendOffer(connection))
      assert.equal(error.vcxCode, VCXCode.INVALID_ISSUER_CREDENTIAL_HANDLE)
    })

    it('throws: connection not initialized', async () => {
      const connection = new (Connection as any)()
      const issuerCredential = await issuerCredentialCreate()
      const error = await shouldThrow(() => issuerCredential.sendOffer(connection))
      assert.equal(error.vcxCode, VCXCode.INVALID_CONNECTION_HANDLE)
    })
  })

  describe('sendCredential:', () => {
    it('success', async () => {
      const connection = await connectionCreateConnect()
      const issuerCredential = await issuerCredentialCreate()
      await issuerCredential.sendOffer(connection)
      VCXMock.setVcxMock(VCXMockMessage.CredentialReq)
      VCXMock.setVcxMock(VCXMockMessage.UpdateCredential)
      await issuerCredential.updateState()
      assert.equal(await issuerCredential.getState(), StateType.RequestReceived)
      await issuerCredential.sendCredential(connection)
      assert.equal(await issuerCredential.getState(), StateType.Accepted)
    })

    it('throws: not initialized', async () => {
      const connection = await connectionCreateConnect()
      const issuerCredential = new (IssuerCredential as any)()
      const error = await shouldThrow(() => issuerCredential.sendCredential(connection))
      assert.equal(error.vcxCode, VCXCode.INVALID_ISSUER_CREDENTIAL_HANDLE)
    })

    it('throws: no offer', async () => {
      const connection = await connectionCreateConnect()
      const issuerCredential = await issuerCredentialCreate()
      const error = await shouldThrow(() => issuerCredential.sendCredential(connection))
      assert.equal(error.vcxCode, VCXCode.NOT_READY)
    })

    it('throws: no request', async () => {
      const connection = await connectionCreateConnect()
      const issuerCredential = await issuerCredentialCreate()
      await issuerCredential.sendOffer(connection)
      const error = await shouldThrow(() => issuerCredential.sendCredential(connection))
      assert.equal(error.vcxCode, VCXCode.NOT_READY)
    })
  })

  describe('GC:', function () {
    this.timeout(TIMEOUT_GC)

    const issuerCredentialCreateAndDelete = async () => {
      let issuerCredential: IssuerCredential | null = await issuerCredentialCreate()
      const handle = issuerCredential.handle
      issuerCredential = null
      return handle
    }
    it('calls release', async () => {
      const handle = await issuerCredentialCreateAndDelete()
      await gcTest({
        handle,
        serialize: rustAPI().vcx_issuer_credential_serialize,
        stopCode: VCXCode.INVALID_ISSUER_CREDENTIAL_HANDLE
      })
    })
  })
})