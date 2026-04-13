import {seedDatabase} from '../src/database/seeders/mongo/seeder';
import { provisionEnterpriseContractsForSeededOrgs } from '../src/database/seeders/mongo/provision-space-contracts';

await seedDatabase();
await provisionEnterpriseContractsForSeededOrgs();
