import { getChatGPTUser } from './chatgpt-auth';
import Admin from './admin';
export const dynamic = 'force-dynamic';
export default async function Home(){ const user=await getChatGPTUser(); return <Admin signedIn={!!user} />; }
