import type {Shop,Fulfillment} from './shared';
export type OrderSummary={id:string,token:string,date:string,shop:Shop,items:{id:string,name:string,quantity:number,price:number}[],customer:string,phone:string,address:string,notes:string,total:number,subtotal?:number,shippingFee?:number,discount?:number,couponCode?:string,discountPercent?:number,status:'pending',fulfillment?:Fulfillment};
