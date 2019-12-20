import {LogLevel} from "../Framework/live2dcubismframework";

export namespace LAppDefine {
    export const ViewMaxScale: number = 2.0;
    export const ViewMinScale: number = 0.8;

    export const ViewLogicalLeft: number = -1.0;
    export const ViewLogicalRight: number = 1.0;

    export const ViewLogicalMaxLeft: number = -2.0;
    export const ViewLogicalMaxRight: number = 2.0;
    export const ViewLogicalMaxBottom: number = -2.0;
    export const ViewLogicalMaxTop: number = 2.0;

    export const ResourcesPath: string = "./resources/";

    export const ModelDir: string = "Hiyori";

    export const MotionGroupIdle: string = "Idle";
    export const MotionGroupTapBody: string = "TapBody";

    export const HitAreaNameHead: string = "Head";
    export const HitAreaNameBody: string = "Body";

    export const PriorityNone: number = 0;
    export const PriorityIdle: number = 1;
    export const PriorityNormal: number = 2;
    export const PriorityForce: number = 3;

    export const DebugLogEnable: boolean = true;
    export const DebugTouchLogEnable: boolean = false;

    export const CubismLoggingLevel: LogLevel = LogLevel.LogLevel_Verbose;
}
