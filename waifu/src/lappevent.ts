export namespace LAppEvent {
    export const EventFaceTap: CustomEvent = new CustomEvent("onL2dTap", {detail: "face"});
    export const EventBreastTap: CustomEvent = new CustomEvent("onL2dTap", {detail: "breast"});
    export const EventHeadTap: CustomEvent = new CustomEvent("onL2dTap", {detail: "head"});
    export const EventBodyTap: CustomEvent = new CustomEvent("onL2dTap", {detail: "body"});
}