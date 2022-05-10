import { Box, Flex, Text } from "rebass";
import { formatBytes } from "../../utils/filename";
import ListItem from "../list-item";
import * as Icon from "../icons";
import { downloadAttachment } from "../../common/attachments";
import { reuploadAttachment } from "../editor/plugins/picker";
import { store } from "../../stores/attachment-store";
import { db } from "../../common/db";
import { Multiselect } from "../../common/multi-select";
import {
  closeOpenedDialog,
  showAttachmentsDialog,
  showPromptDialog,
} from "../../common/dialog-controller";
import { hashNavigate } from "../../navigation";

const workStatusMap = {
  recheck: "Rechecking...",
  delete: "Deleting...",
};
function Attachment({ item, isCompact, index }) {
  const attachment = item;
  const status = attachment.status;

  return (
    <ListItem
      selectable
      isCompact={isCompact}
      item={{ ...attachment, title: attachment.metadata.filename }}
      title={attachment.metadata.filename}
      body={
        attachment.failed && <Text variant={"error"}>{attachment.failed}</Text>
      }
      menu={{
        items: menuItems,
        extraData: { attachment },
      }}
      onClick={() => {
        if (isCompact) showAttachmentsDialog();
      }}
      footer={
        isCompact ? (
          <Flex
            alignItems="center"
            sx={{
              fontSize: "subBody",
              color: "fontTertiary",
            }}
          >
            {status ? (
              <Text variant="subBody" title={`${status.type}ing`}>
                {formatBytes(status.loaded, 1)}/{formatBytes(status.total, 1)}
              </Text>
            ) : (
              <Text mr={1}>{formatBytes(attachment.length)}</Text>
            )}
            {attachment.failed && (
              <Icon.AttachmentError
                sx={{ flexShrink: 0 }}
                color={"error"}
                size={13}
                title={attachment.failed}
              />
            )}

            {attachment.isDeleting ? (
              <Icon.Loading
                sx={{ flexShrink: 0 }}
                size={13}
                title={"Deleting.."}
              />
            ) : attachment.dateUploaded ? (
              <Icon.DoubleCheckmark
                sx={{ flexShrink: 0 }}
                color={"primary"}
                size={13}
                title={"Uploaded"}
              />
            ) : (
              <Icon.Checkmark
                sx={{ flexShrink: 0 }}
                color={"icon"}
                size={13}
                title={"Waiting for upload"}
              />
            )}
          </Flex>
        ) : attachment.working ? (
          <Flex>
            <Icon.Loading size={13} />
            <Text variant={"subBody"} ml={1}>
              {workStatusMap[attachment.working]}
            </Text>
          </Flex>
        ) : (
          <Flex flexDirection={"column"}>
            {status && (
              <Flex flexDirection={"column"}>
                <Text variant="subBody">
                  {formatBytes(status.loaded, 1)}/{formatBytes(status.total, 1)}{" "}
                  ({status.type}ing)
                </Text>
                <Box
                  sx={{
                    my: 1,
                    bg: "primary",
                    height: "2px",
                    width: `${status.progress}%`,
                  }}
                />
              </Flex>
            )}
            <Flex
              alignItems="center"
              sx={{
                fontSize: "subBody",
                color: "fontTertiary",
              }}
            >
              <Text mr={1}>{formatBytes(attachment.length)}</Text>
              <Text mr={1}>{attachment.metadata.type}</Text>
              {attachment.noteIds && (
                <Text mr={1}>{attachment.noteIds.length} notes</Text>
              )}
              {attachment.metadata.hash && (
                <Text className="selectable" mr={0}>
                  {attachment.metadata.hash}
                </Text>
              )}
            </Flex>
          </Flex>
        )
      }
      index={index}
    />
  );
}
export default Attachment;

const menuItems = [
  {
    key: "notes",
    title: "Notes",
    icon: Icon.References,
    items: ({ attachment }) =>
      attachment.noteIds.reduce((prev, curr) => {
        const note = db.notes.note(curr);
        if (!note) prev.push({ key: curr, title: `Note with id ${curr}` });
        else
          prev.push({
            key: note.id,
            title: note.title,
            onClick: () => {
              hashNavigate(`/notes/${curr}/edit`);
              closeOpenedDialog();
            },
          });
        return prev;
      }, []),
  },
  {
    key: "recheck",
    title: () => "Recheck",
    icon: Icon.DoubleCheckmark,
    disabled: ({ attachment }) =>
      !attachment.dateUploaded ? "This attachment is not uploaded yet." : false,
    onClick: async ({ items }) => {
      await store.recheck(items.map((i) => i.metadata.hash));
    },
    multiSelect: true,
  },
  {
    key: "rename",
    title: () => "Rename",
    icon: Icon.Rename,
    onClick: async ({ attachment }) => {
      const newName = await showPromptDialog({
        title: "Rename attachment",
        description: attachment.metadata.filename,
        defaultValue: attachment.metadata.filename,
      });
      if (!newName) return;
      await store.rename(attachment.metadata.hash, newName);
    },
  },
  {
    key: "download",
    title: ({ attachment }) =>
      attachment.status?.type === "download" ? "Cancel download" : "Download",
    icon: Icon.Download,
    disabled: ({ attachment }) =>
      !attachment.dateUploaded ? "This attachment is not uploaded yet." : false,
    onClick: async ({ attachment }) => {
      const isDownloading = attachment.status?.type === "download";
      if (isDownloading) {
        await db.fs.cancel(attachment.metadata.hash, "download");
      } else await downloadAttachment(attachment.metadata.hash);
    },
  },
  {
    key: "reupload",
    title: ({ attachment }) =>
      attachment.status?.type === "upload" ? "Cancel upload" : "Reupload",
    icon: Icon.Reupload,
    onClick: async ({ attachment }) => {
      const isDownloading = attachment.status?.type === "upload";
      if (isDownloading) {
        await db.fs.cancel(attachment.metadata.hash, "upload");
      } else
        await reuploadAttachment(
          attachment.metadata.type,
          attachment.metadata.hash
        );
    },
  },
  {
    key: "permanent-delete",
    color: "error",
    iconColor: "error",
    title: () => "Delete permanently",
    icon: Icon.DeleteForver,
    onClick: ({ items }) => Multiselect.deleteAttachments(items),
    multiSelect: true,
  },
];
