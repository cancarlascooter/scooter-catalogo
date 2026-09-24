import {effectivePermissions} from '@/app/admin-permissions';
import {redirect} from 'next/navigation';
import {passwordMode,currentAdmin} from '@/lib/admin-auth';
import Admin from '../admin';
import AccountManager from '../account-manager';
export const dynamic='force-dynamic';
export default async function Administrator(){if(!passwordMode())redirect('/');const user=await currentAdmin();if(!user)redirect('/acceso');return <><Admin signedIn passwordAuth initialPermissions={effectivePermissions(user)}/></>}
