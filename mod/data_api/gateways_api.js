/**
 * @author Pedro Sanders
 * @since v1
 */
import DSUtil from 'data_api/utils'
import { Status } from 'data_api/status'
import isEmpty from 'utils/obj_util'

const foundDependentObjects = { status: Status.CONFLICT, message: Status.message[4092].value }

export default class GatewaysAPI {

    constructor(dataSource) {
        this.ds = dataSource
    }

    createFromJSON(jsonObj) {
        return this.gatewayExist(jsonObj.spec.regService.host)? DSUtil.buildResponse(Status.CONFLICT):this.ds.insert(jsonObj)
    }

    updateFromJSON(jsonObj) {
        return !this.gatewayExist(jsonObj.spec.regService.host)? DSUtil.buildResponse(Status.NOT_FOUND):this.ds.update(jsonObj)
    }

    getGateways(filter)  {
        return this.ds.withCollection('gateways').find(filter)
    }

    getGateway(ref) {
       return DSUtil.deepSearch(this.getGateways().result, "metadata.ref", ref)
    }

    getGatewayByHost(host) {
       return DSUtil.deepSearch(this.getGateways().result, "spec.regService.host", host)
    }

    gatewayExist(host) {
        return DSUtil.objExist(this.getGatewayByHost(host))
    }

    deleteGateway(ref) {
        let response = this.getGateway(ref)

        if (response.status != Status.OK) {
            return response
        }

        const gateway = response.result

        response = this.ds.withCollection('dids').find("@.metadata.gwRef=='" + gateway.metadata.ref + "'")
        const dids = response.result

        return dids.length == 0? this.ds.withCollection('gateways').remove(ref): foundDependentObjects
    }

}