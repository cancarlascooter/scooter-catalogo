import handler from 'vinext/server/fetch-handler';
import {purgeExpiredDocuments} from './lib/customer-verification';
export default {
 fetch:handler.fetch,
 async scheduled(){await purgeExpiredDocuments()},
};
