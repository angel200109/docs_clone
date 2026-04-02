/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { LoaderIcon, SearchIcon, TrashIcon, UserPlus2Icon } from "lucide-react";

import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface ShareDialogProps {
  documentId: Id<"documents">;
  documentTitle: string;
  children: React.ReactNode;
}

type MemberRole = "owner" | "editor" | "viewer";
type EditableRole = Exclude<MemberRole, "owner">;
type SearchResultUser = {
  id: string;
  fullName: string;
  username: string | null;
  emailAddress: string;
  imageUrl: string;
};

export const ShareDialog = ({
  documentId,
  documentTitle,
  children,
}: ShareDialogProps) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResultUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<SearchResultUser | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [role, setRole] = useState<EditableRole>("viewer");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingRoleByUserId, setPendingRoleByUserId] = useState<Record<string, boolean>>({});
  const [pendingRemoveByUserId, setPendingRemoveByUserId] = useState<Record<string, boolean>>({});

  const members = useQuery(api.documentMembers.listByDocument, { documentId });
  const upsertMemberRole = useMutation(api.documentMembers.upsertMemberRole);
  const removeMember = useMutation(api.documentMembers.removeMember);

  useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setSearchResults([]);
      setSelectedUser(null);
      return;
    }

    const normalizedQuery = searchQuery.trim();
    if (normalizedQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      try {
        setIsSearching(true);
        const response = await fetch(
          `/api/clerk-users?documentId=${documentId}&query=${encodeURIComponent(normalizedQuery)}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error("Search failed");
        }

        const payload = (await response.json()) as { users: SearchResultUser[] };
        setSearchResults(payload.users);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          toast.error("搜索用户失败");
        }
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [documentId, open, searchQuery]);

  const handleInvite = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selectedUser) {
      toast.error("请先从搜索结果中选择一个用户");
      return;
    }

    setIsSubmitting(true);
    try {
      await upsertMemberRole({
        documentId,
        userId: selectedUser.id,
        role,
      });
      toast.success("成员权限已更新");
      setSelectedUser(null);
      setSearchQuery("");
      setSearchResults([]);
      setRole("viewer");
    } catch {
      toast.error("更新成员失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = async (memberUserId: string, nextRole: EditableRole) => {
    setPendingRoleByUserId((current) => ({ ...current, [memberUserId]: true }));
    try {
      await upsertMemberRole({
        documentId,
        userId: memberUserId,
        role: nextRole,
      });
      toast.success("权限已更新");
    } catch {
      toast.error("更新权限失败");
    } finally {
      setPendingRoleByUserId((current) => ({ ...current, [memberUserId]: false }));
    }
  };

  const handleRemove = async (memberUserId: string) => {
    setPendingRemoveByUserId((current) => ({ ...current, [memberUserId]: true }));
    try {
      await removeMember({ documentId, userId: memberUserId });
      toast.success("成员已移除");
    } catch {
      toast.error("移除成员失败");
    } finally {
      setPendingRemoveByUserId((current) => ({ ...current, [memberUserId]: false }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>分享文档</DialogTitle>
          <DialogDescription>
            当前文档：{documentTitle}。输入邮箱、姓名或用户名搜索 Clerk 用户并分配权限。
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleInvite} className="grid gap-3 rounded-lg border p-4">
          <div className="grid gap-2">
            <label htmlFor="share-user-search" className="text-sm font-medium">
              搜索用户
            </label>
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="share-user-search"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedUser(null);
                }}
                placeholder="输入邮箱、姓名或用户名"
                disabled={isSubmitting}
                className="pl-9"
              />
              {isSearching ? (
                <LoaderIcon className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
              ) : null}
            </div>
          </div>

          {selectedUser ? (
            <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
              <div className="flex min-w-0 items-center gap-3">
                <img
                  src={selectedUser.imageUrl}
                  alt={selectedUser.fullName}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{selectedUser.fullName}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {selectedUser.emailAddress || selectedUser.username || selectedUser.id}
                  </div>
                </div>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedUser(null)}>
                取消选择
              </Button>
            </div>
          ) : searchQuery.trim().length >= 2 ? (
            <div className="max-h-56 overflow-y-auto rounded-lg border">
              {searchResults.length === 0 && !isSearching ? (
                <div className="px-3 py-4 text-sm text-muted-foreground">没有找到匹配用户</div>
              ) : (
                searchResults.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => setSelectedUser(user)}
                    className="flex w-full items-center gap-3 border-b px-3 py-3 text-left transition-colors hover:bg-accent last:border-b-0"
                  >
                    <img
                      src={user.imageUrl}
                      alt={user.fullName}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{user.fullName}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {user.emailAddress || user.username || user.id}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          ) : null}

          <div className="text-xs text-muted-foreground">
            输入至少 2 个字符后开始搜索。搜索结果不会展示当前登录用户。
          </div>

          <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
            <div className="grid gap-2">
              <label className="text-sm font-medium">角色</label>
              <Select value={role} onValueChange={(value) => setRole(value as EditableRole)}>
                <SelectTrigger>
                  <SelectValue placeholder="选择角色" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">viewer</SelectItem>
                  <SelectItem value="editor">editor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={isSubmitting}>
              <UserPlus2Icon className="size-4" />
              添加或更新权限
            </Button>
          </div>
        </form>

        <div className="grid gap-3">
          <div className="text-sm font-medium">当前成员</div>
          {members === undefined ? (
            <div className="text-sm text-muted-foreground">加载成员中...</div>
          ) : members.length === 0 ? (
            <div className="text-sm text-muted-foreground">暂无成员</div>
          ) : (
            <div className="grid gap-2">
              {members.map((member) => {
                const isOwner = member.role === "owner";
                const roleLoading = !!pendingRoleByUserId[member.userId];
                const removeLoading = !!pendingRemoveByUserId[member.userId];

                return (
                  <div
                    key={member.userId}
                    className="grid gap-3 rounded-lg border p-3 sm:grid-cols-[minmax(0,1fr)_180px_auto] sm:items-center"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{member.userId}</div>
                      <div className="text-xs text-muted-foreground">
                        invited by {member.invitedBy}
                      </div>
                    </div>
                    {isOwner ? (
                      <Badge className="w-fit">owner</Badge>
                    ) : (
                      <Select
                        value={member.role}
                        onValueChange={(value) => handleRoleChange(member.userId, value as EditableRole)}
                        disabled={roleLoading || removeLoading}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="viewer">viewer</SelectItem>
                          <SelectItem value="editor">editor</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    <div className="flex justify-end">
                      {isOwner ? null : (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={removeLoading || roleLoading}
                          onClick={() => handleRemove(member.userId)}
                        >
                          <TrashIcon className="size-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};