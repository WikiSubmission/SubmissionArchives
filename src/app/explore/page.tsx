import { getDiscoveryRecords } from '@/lib/research/discovery';
import ExploreClient from './ExploreClient';
export const metadata = { title: 'Timeline and topics' };
export default function Page() { return <ExploreClient records={getDiscoveryRecords()} />; }
