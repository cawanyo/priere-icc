import { Prisma } from "@prisma/client";

export type SpecialEventWithPlaning = Prisma.SpecialEventGetPayload<{
  include: {
    plannings: {include : { intercessors: true}},
  };
}>;

export type SpecialEventWithTemplate = Prisma.SpecialEventGetPayload<{
  include: {
    templates: true
  };
}>;

export type SpecialEvent = Prisma.SpecialEventGetPayload<{

}>;

export type PlaningWithIntercessor = Prisma.PlanningGetPayload<{
  include: {
    intercessors: true
  }
}>

export type Planing = Prisma.PlanningGetPayload<{

}>

export type TemplatePrisma = Prisma.EventTemplateGetPayload<{}>