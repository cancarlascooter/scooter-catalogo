import { getChatGPTUser } from './chatgpt-auth';
import Admin from './admin';
import {passwordMode,authDb} from '@/lib/admin-auth';
import {redirect} from 'next/navigation';
export const dynamic = 'force-dynamic';
export default async function Home(){
 if(passwordMode()){const shop=await authDb().prepare('SELECT s.id FROM shops s JOIN admin_installation a ON a.owner_id=s.owner WHERE a.slot=1').first<{id:string}>();if(shop)redirect('/tienda/'+shop.id);return <main className="access-page"><section className="panel access-card"><h1>Estamos preparando nuestra tienda</h1><p>Pronto podrás explorar nuestros productos.</p><a href="/acceso">Acceso de administrador</a></section></main>}
 const user=await getChatGPTUser();return <Admin signedIn={!!user}/>;
}
