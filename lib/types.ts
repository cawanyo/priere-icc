import { Prisma } from "@prisma/client";

export type SpecialEventWithPlaning = Prisma.SpecialEventGetPayload<{
  include: {
    plannings: {include : { users: true}},
  };
}>;

export type SpecialEventWithTemplate = Prisma.SpecialEventGetPayload<{
  include: {
    eventTemplates: true
  };
}>;

export type SpecialEvent = Prisma.SpecialEventGetPayload<{

}>;

export type PlaningWithIntercessor = Prisma.PlanningGetPayload<{
  include: {
    users: true
  }
}>

export type Planing = Prisma.PlanningGetPayload<{

}>

export type TemplatePrisma = Prisma.EventTemplateGetPayload<{}>