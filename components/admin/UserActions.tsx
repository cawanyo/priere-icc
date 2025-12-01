"use client";

import { useState } from "react";
import { MoreHorizontal, Trash, UserCog, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { deleteUser, updateUserRole } from "@/app/actions/admin";
import { toast } from "sonner";
import { Role } from "@prisma/client";

interface UserActionsProps {
  userId: string;
  currentRole: Role;
  userName: string;
}

export function UserActions({ userId, currentRole, userName }: UserActionsProps) {
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role>(currentRole);

  const handleDelete = async () => {
    setLoading(true);
    const res = await deleteUser(userId);
    setLoading(false);
    if (res.success) {
      toast.success(res.message);
      setIsDeleteOpen(false);
    } else {
      toast.error(res.message);
    }
  };

  const handleUpdate = async () => {
    setLoading(true);
    const res = await updateUserRole(userId, selectedRole);
    setLoading(false);
    if (res.success) {
      toast.success(res.message);
      setIsUpdateOpen(false);
    } else {
      toast.error(res.message);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Ouvrir menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => setIsUpdateOpen(true)}>
            <UserCog className="mr-2 h-4 w-4" /> Changer le rôle
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setIsDeleteOpen(true)} className="text-red-600 focus:text-red-700 focus:bg-red-50">
            <Trash className="mr-2 h-4 w-4" /> Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* DIALOGUE UPDATE ROLE */}
      <Dialog open={isUpdateOpen} onOpenChange={setIsUpdateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le rôle</DialogTitle>
            <DialogDescription>
              Changer le niveau d'accès pour <span className="font-semibold text-indigo-900">{userName}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select 
                defaultValue={currentRole} 
                onValueChange={(val) => setSelectedRole(val as Role)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="REQUESTER">Requester (Utilisateur)</SelectItem>
                <SelectItem value="PRAYER_LEADER">Conducteur de Prière</SelectItem> {/* AJOUT ICI */}
                <SelectItem value="INTERCESSOR">Intercesseur</SelectItem>
                <SelectItem value="LEADER">Leader</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUpdateOpen(false)}>Annuler</Button>
            <Button onClick={handleUpdate} disabled={loading} className="bg-indigo-900 hover:bg-indigo-800">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sauvegarder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOGUE DELETE */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Êtes-vous absolument sûr ?</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. Cela supprimera définitivement le compte de 
              <span className="font-bold text-foreground"> {userName}</span>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Annuler</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}