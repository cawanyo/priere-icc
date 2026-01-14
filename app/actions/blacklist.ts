'use server'
import { prisma } from "@/lib/prisma";


export async function isBlackList(userId: String, hour: String) {
    try {
        const list = await prisma.blackList.findMany({
            where: {
                userId: userId.toString(),
                hour: hour.toString(),
            }
        });
      if (list.length > 0) {
        return  true
      }
    } catch (error) {
      
      return false
    }
}


export async function updateBlackList(userId: String, hour: String) {
    try {
        await prisma.blackList.create({
        data: {
           userId: userId.toString(),
           hour: hour.toString(),
        }});

        const list = await prisma.blackList.findMany({
            where: {
                userId: userId.toString(),
            }
        });
        if (list.length === 4) {
            await prisma.blackList.deleteMany({
                where: {
                    userId: userId.toString(),
                }
            });
        }
      return { success: true};
    } catch (error) {
      
      return { success: false, error};
    }

}