// deno-lint-ignore-file no-explicit-any
import { createContainer, asValue, asClass, AwilixContainer } from "awilix";
import dotenv from "dotenv";
import process from "node:process";

import MongooseUserRepository from "../repositories/mongoose/UserRepository";
import MongoosePricingRepository from "../repositories/mongoose/PricingRepository";
import MongoosePricingCollectionRepository from "../repositories/mongoose/PricingCollectionRepository";
import MongooseDatasheetRepository from "../repositories/mongoose/DatasheetRepository";
import MongooseDatasheetCollectionRepository from "../repositories/mongoose/DatasheetCollectionRepository";
import MongooseOrganizationRepository from "../repositories/mongoose/OrganizationRepository";
import MongooseGroupRepository from "../repositories/mongoose/GroupRepository";
import MongooseOrganizationMembershipRepository from "../repositories/mongoose/OrganizationMembershipRepository";
import MongooseGroupMembershipRepository from "../repositories/mongoose/GroupMembershipRepository";
import MongooseGroupCollectionRepository from "../repositories/mongoose/GroupCollectionRepository";
import MongooseOrganizationInvitationRepository from "../repositories/mongoose/OrganizationInvitationRepository";

import UserService from "../services/UserService";
import PricingService from "../services/PricingService";
import PricingCollectionService from "../services/PricingCollectionService";
import DatasheetService from "../services/DatasheetService";
import DatasheetCollectionService from "../services/DatasheetCollectionService";
import CacheService from "../services/CacheService";
import OrganizationService from "../services/OrganizationService";
import OrganizationMembershipService from "../services/OrganizationMembershipService";
import GroupService from "../services/GroupService";
import GroupMembershipService from "../services/GroupMembershipService";
import GroupCollectionService from "../services/GroupCollectionService";
import SpaceService from "../services/SpaceService";
import AuthorizationService from "../services/AuthorizationService";

dotenv.config();

function initContainer(databaseType: string): AwilixContainer {
  const container: AwilixContainer = createContainer();
  let userRepository, pricingRepository, pricingCollectionRepository;
  let datasheetRepository, datasheetCollectionRepository;
  let organizationRepository, groupRepository, organizationMembershipRepository,
      groupMembershipRepository, groupCollectionRepository, organizationInvitationRepository;
  switch (databaseType) {
    case "mongoDB":
      userRepository = new MongooseUserRepository();
      pricingRepository = new MongoosePricingRepository();
      pricingCollectionRepository = new MongoosePricingCollectionRepository();
      datasheetRepository = new MongooseDatasheetRepository();
      datasheetCollectionRepository = new MongooseDatasheetCollectionRepository();
      organizationRepository = new MongooseOrganizationRepository();
      groupRepository = new MongooseGroupRepository();
      organizationMembershipRepository = new MongooseOrganizationMembershipRepository();
      groupMembershipRepository = new MongooseGroupMembershipRepository();
      groupCollectionRepository = new MongooseGroupCollectionRepository();
      organizationInvitationRepository = new MongooseOrganizationInvitationRepository();
      break;
    default:
      throw new Error(`Unsupported database type: ${databaseType}`);
  }
  container.register({
    userRepository: asValue(userRepository),
    pricingRepository: asValue(pricingRepository),
    pricingCollectionRepository: asValue(pricingCollectionRepository),
    datasheetRepository: asValue(datasheetRepository),
    datasheetCollectionRepository: asValue(datasheetCollectionRepository),
    organizationRepository: asValue(organizationRepository),
    groupRepository: asValue(groupRepository),
    organizationMembershipRepository: asValue(organizationMembershipRepository),
    groupMembershipRepository: asValue(groupMembershipRepository),
    groupCollectionRepository: asValue(groupCollectionRepository),
    organizationInvitationRepository: asValue(organizationInvitationRepository),
    userService: asClass(UserService).singleton(),
    pricingService: asClass(PricingService).singleton(),
    pricingCollectionService: asClass(PricingCollectionService).singleton(),
    datasheetService: asClass(DatasheetService).singleton(),
    datasheetCollectionService: asClass(DatasheetCollectionService).singleton(),
    cacheService: asClass(CacheService).singleton(),
    organizationService: asClass(OrganizationService).singleton(),
    organizationMembershipService: asClass(OrganizationMembershipService).singleton(),
    groupService: asClass(GroupService).singleton(),
    groupMembershipService: asClass(GroupMembershipService).singleton(),
    groupCollectionService: asClass(GroupCollectionService).singleton(),
    spaceService: asClass(SpaceService).singleton(),
    authorizationService: asClass(AuthorizationService).singleton(),
  });
  return container;
}

let container: AwilixContainer | null = null;
if (!container) { container = initContainer(process.env.DATABASE_TECHNOLOGY ?? "") }

export default container as AwilixContainer;