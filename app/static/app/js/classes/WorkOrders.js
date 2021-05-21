import axios from 'axios';

class WorkOrders {

    static getWorkOrderList () {
        const workOrderListUrl = '/api/work-order-type-list/';
        return new Promise(async (resolve, reject) => await axios.get(workOrderListUrl, {
            timeout: 5000
        }).then(response => {
            resolve(response.data);
        }).catch(function (error) {
            console.log(error)
            reject();
        }))
    }
}
export default WorkOrders;
