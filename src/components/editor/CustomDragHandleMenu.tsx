import {
    BlockColorsItem,
    DragHandleMenu,
    RemoveBlockItem,
} from "@blocknote/react";
// import { ChangeBlockTypeItem } from "./ChangeBlockTypeItem";
import { BlockTypeSubMenu } from "./BlockTypeSubMenu";

export const CustomDragHandleMenu = () => (
    <DragHandleMenu>
        <BlockTypeSubMenu />
        {/* Item bawaan BlockNote */}
        <BlockColorsItem>Colors</BlockColorsItem>
        <RemoveBlockItem>Delete</RemoveBlockItem>
    </DragHandleMenu>
);