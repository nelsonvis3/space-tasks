import {test} from 'node:test'
import assert from 'node:assert/strict'
import {supportedRuntime} from '../server/runtime.mjs'
test('the runtime floor rejects affected Node releases and accepts patched 24.x releases',()=>{
 for(const version of ['24.0.0','24.21.0','24.22.0','22.22.1','25.0.0','invalid'])assert.equal(supportedRuntime(version),false,version)
 for(const version of ['24.22.1','v24.22.1','24.22.2','24.23.0'])assert.equal(supportedRuntime(version),true,version)
})
