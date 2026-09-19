import {redirect} from 'next/navigation';
import {passwordMode,currentAdmin} from '@/lib/admin-auth';
import Admin from '../admin';
import AccountManager from '../account-manager';
export const dynamic='force-dynamic';
export default async function Administrator(){if(!passwordMode())redirect('/');if(!await currentAdmin())redirect('/acceso');return <><Admin signedIn passwordAuth/><div className="workspace"><AccountManager/></div></>}
