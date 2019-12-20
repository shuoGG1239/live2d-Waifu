import {Live2DCubismFramework as cubismmatrix44} from "../Framework/math/cubismmatrix44";

import {LAppModel} from "./lappmodel";
import {LAppDefine} from "./lappdefine";
import {LAppPal} from "./lapppal";
import {canvas} from "./lappdelegate";
import Csm_CubismMatrix44 = cubismmatrix44.CubismMatrix44;


export let s_instance: LAppLive2DManager = null;

export class LAppLive2DManager {
    _viewMatrix: Csm_CubismMatrix44;
    _model: LAppModel;

    constructor() {
        this._viewMatrix = new Csm_CubismMatrix44();
        this._model = new LAppModel();
        const modelPath: string = LAppDefine.ResourcesPath + LAppDefine.ModelDir + "/";
        const modelJsonName: string = LAppDefine.ModelDir + ".model3.json";
        this._model.loadAssets(modelPath, modelJsonName);
    }

    public static getInstance(): LAppLive2DManager {
        if (s_instance == null) {
            s_instance = new LAppLive2DManager();
        }
        return s_instance;
    }

    public static releaseInstance(): void {
        if (s_instance != null) {
            s_instance = void 0;
        }
        s_instance = null;
    }

    public onDrag(x: number, y: number): void {
        this._model.setDragging(x, y);
    }

    public onTap(x: number, y: number): void {
        if (LAppDefine.DebugLogEnable) {
            LAppPal.printLog("[APP]tap point: {x: {0} y: {1}}", x.toFixed(2), y.toFixed(2));
        }
        /* 摸头则表情变; 摸身子则动作变 */
        if (this._model.hitTest(LAppDefine.HitAreaNameHead, x, y)) {
            this._model.setRandomExpression();
        } else if (this._model.hitTest(LAppDefine.HitAreaNameBody, x, y)) {
            this._model.startRandomMotion(LAppDefine.MotionGroupTapBody, LAppDefine.PriorityNormal);
        }
    }

    public onUpdate(): void {
        let projection: Csm_CubismMatrix44 = new Csm_CubismMatrix44();
        const width: number = canvas.width;
        const height: number = canvas.height;
        const factor: number = 5; // 调整这个比例以让live2d模型能适配canvas的比例s
        projection.scale(factor, factor * width / height);
        if (this._viewMatrix != null) {
            projection.multiplyByMatrix(this._viewMatrix);
        }
        const saveProjection: Csm_CubismMatrix44 = projection.clone();
        this._model.update();
        this._model.draw(saveProjection.clone());
    }

}
