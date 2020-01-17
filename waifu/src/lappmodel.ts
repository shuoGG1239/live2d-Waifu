import {Live2DCubismFramework as live2dcubismframework} from "../Framework/live2dcubismframework";
import {Live2DCubismFramework as cubismid} from "../Framework/id/cubismid";
import {Live2DCubismFramework as cubismusermodel} from "../Framework/model/cubismusermodel";
import {Live2DCubismFramework as icubismmodelsetting} from "../Framework/icubismmodelsetting";
import {Live2DCubismFramework as cubismmodelsettingjson} from "../Framework/cubismmodelsettingjson";
import {Live2DCubismFramework as cubismdefaultparameterid} from "../Framework/cubismdefaultparameterid";
import {Live2DCubismFramework as acubismmotion} from "../Framework/motion/acubismmotion";
import {Live2DCubismFramework as cubismeyeblink} from "../Framework/effect/cubismeyeblink";
import {Live2DCubismFramework as cubismbreath} from "../Framework/effect/cubismbreath";
import {Live2DCubismFramework as csmvector} from "../Framework/type/csmvector";
import {Live2DCubismFramework as csmmap} from "../Framework/type/csmmap";
import {Live2DCubismFramework as cubismmatrix44} from "../Framework/math/cubismmatrix44";
import {Live2DCubismFramework as cubismstring} from "../Framework/utils/cubismstring";
import {Live2DCubismFramework as cubismmotion} from "../Framework/motion/cubismmotion";
import {Live2DCubismFramework as cubismmotionqueuemanager} from "../Framework/motion/cubismmotionqueuemanager";
import {Live2DCubismFramework as csmstring} from "../Framework/type/csmstring";
import {Live2DCubismFramework as csmrect} from "../Framework/type/csmrectf";
import {CubismLogInfo} from "../Framework/utils/cubismdebug";

import {CafeGunGirlParam} from "./cafegungirldefine"
import {LAppDefine} from "./lappdefine";
import {LAppPal} from "./lapppal";
import {canvas, frameBuffer, gl, LAppDelegate} from "./lappdelegate";
import {TextureInfo} from "./lapptexturemanager";
import "whatwg-fetch";
import csmRect = csmrect.csmRect;
import csmString = csmstring.csmString;
import InvalidMotionQueueEntryHandleValue = cubismmotionqueuemanager.InvalidMotionQueueEntryHandleValue;
import CubismMotionQueueEntryHandle = cubismmotionqueuemanager.CubismMotionQueueEntryHandle;
import CubismMotion = cubismmotion.CubismMotion;
import CubismString = cubismstring.CubismString;
import CubismMatrix44 = cubismmatrix44.CubismMatrix44;
import csmMap = csmmap.csmMap;
import csmVector = csmvector.csmVector;
import CubismBreath = cubismbreath.CubismBreath;
import BreathParameterData = cubismbreath.BreathParameterData;
import CubismEyeBlink = cubismeyeblink.CubismEyeBlink;
import ACubismMotion = acubismmotion.ACubismMotion;
import CubismFramework = live2dcubismframework.CubismFramework;
import CubismIdHandle = cubismid.CubismIdHandle;
import CubismUserModel = cubismusermodel.CubismUserModel;
import ICubismModelSetting = icubismmodelsetting.ICubismModelSetting;
import CubismModelSettingJson = cubismmodelsettingjson.CubismModelSettingJson;
import CubismDefaultParameterId = cubismdefaultparameterid;

function createBuffer(path: string, callBack: any): void {
    LAppPal.loadFileAsBytes(path, callBack);
}

function deleteBuffer(buffer: ArrayBuffer, path: string = "") {
    LAppPal.releaseBytes(buffer);
}

enum LoadStep {
    LoadAssets,
    LoadModel,
    WaitLoadModel,
    LoadExpression,
    WaitLoadExpression,
    LoadPhysics,
    WaitLoadPhysics,
    LoadPose,
    WaitLoadPose,
    SetupEyeBlink,
    SetupBreath,
    LoadUserData,
    WaitLoadUserData,
    SetupEyeBlinkIds,
    SetupLipSyncIds,
    SetupLayout,
    LoadMotion,
    WaitLoadMotion,
    CompleteInitialize,
    CompleteSetupModel,
    LoadTexture,
    WaitLoadTexture,
    CompleteSetup,
}

/**
 * live2d模型载入/渲染/更新等
 */
export class LAppModel extends CubismUserModel {
    public loadAssets(dir: string, fileName: string): void {
        this._modelHomeDir = dir;
        const path: string = dir + fileName;
        fetch(path).then(
            (response) => {
                return response.arrayBuffer();
            }
        ).then(
            (arrayBuffer) => {
                let buffer: ArrayBuffer = arrayBuffer;
                let size = buffer.byteLength;
                let setting: ICubismModelSetting = new CubismModelSettingJson(buffer, size);
                this._state = LoadStep.LoadModel; // 更新state
                this.setupModel(setting); // 保存结果
            }
        );
    }

    /**
     * 从model3.json中加载出model
     */
    private setupModel(setting: ICubismModelSetting): void {
        this._updating = true;
        this._initialized = false;

        this._modelSetting = setting;

        let buffer: ArrayBuffer;
        // CubismModel
        if (this._modelSetting.getModelFileName() != "") {
            let path: string = this._modelSetting.getModelFileName();
            path = this._modelHomeDir + path;

            fetch(path).then(
                (response) => {
                    return response.arrayBuffer();
                }
            ).then(
                (arrayBuffer) => {
                    buffer = arrayBuffer;
                    this.loadModel(buffer);
                    deleteBuffer(buffer, path);
                    this._state = LoadStep.LoadExpression;
                    loadCubismExpression();
                }
            );

            this._state = LoadStep.WaitLoadModel;
        } else {
            LAppPal.printLog("Model data does not exist.");
        }

        // Expression 表情
        let loadCubismExpression = () => {
            if (this._modelSetting.getExpressionCount() > 0) {
                const count: number = this._modelSetting.getExpressionCount();

                for (let i: number = 0; i < count; i++) {
                    let name: string = this._modelSetting.getExpressionName(i);
                    let path: string = this._modelSetting.getExpressionFileName(i);
                    path = this._modelHomeDir + path;

                    fetch(path).then(
                        (response) => {
                            return response.arrayBuffer();
                        }
                    ).then(
                        (arrayBuffer) => {
                            let buffer: ArrayBuffer = arrayBuffer;
                            let size: number = buffer.byteLength;
                            let motion: ACubismMotion = this.loadExpression(buffer, size, name);

                            if (this._expressions.getValue(name) != null) {
                                ACubismMotion.delete(this._expressions.getValue(name));
                                this._expressions.setValue(name, null);
                            }
                            this._expressions.setValue(name, motion);
                            deleteBuffer(buffer, path);
                            this._expressionCount++;
                            if (this._expressionCount >= count) {
                                this._state = LoadStep.LoadPhysics;
                                loadCubismPhysics();
                            }
                        }
                    );
                }
                this._state = LoadStep.WaitLoadExpression;
            } else {
                this._state = LoadStep.LoadPhysics;
                loadCubismPhysics();
            }
        };

        // Physics
        let loadCubismPhysics = () => {
            if (this._modelSetting.getPhysicsFileName() != "") {
                let path: string = this._modelSetting.getPhysicsFileName();
                path = this._modelHomeDir + path;

                fetch(path).then(
                    (response) => {
                        return response.arrayBuffer();
                    }
                ).then(
                    (arrayBuffer) => {
                        let buffer: ArrayBuffer = arrayBuffer;
                        let size: number = buffer.byteLength;
                        this.loadPhysics(buffer, size);
                        deleteBuffer(buffer, path);
                        this._state = LoadStep.LoadPose;
                        loadCubismPose();
                    }
                );
                this._state = LoadStep.WaitLoadPhysics;
            } else {
                this._state = LoadStep.LoadPose;
                loadCubismPose();
            }
        };

        // Pose
        let loadCubismPose = () => {
            if (this._modelSetting.getPoseFileName() != "") {
                let path: string = this._modelSetting.getPoseFileName();
                path = this._modelHomeDir + path;

                fetch(path).then(
                    (response) => {
                        return response.arrayBuffer();
                    }
                ).then(
                    (arrayBuffer) => {
                        let buffer: ArrayBuffer = arrayBuffer;
                        let size: number = buffer.byteLength;
                        this.loadPose(buffer, size);
                        deleteBuffer(buffer, path);
                        this._state = LoadStep.SetupEyeBlink;
                        setupEyeBlink();
                    }
                );
                this._state = LoadStep.WaitLoadPose;
            } else {
                this._state = LoadStep.SetupEyeBlink;
                setupEyeBlink();
            }
        };

        // EyeBlink
        let setupEyeBlink = () => {
            if (this._modelSetting.getEyeBlinkParameterCount() > 0) {
                this._eyeBlink = CubismEyeBlink.create(this._modelSetting);
                this._state = LoadStep.SetupBreath;
            }
            setupBreath();
        };

        // Breath
        let setupBreath = () => {
            this._breath = CubismBreath.create();

            let breathParameters: csmVector<BreathParameterData> = new csmVector();
            breathParameters.pushBack(new BreathParameterData(this._idParamAngleX, 0.0, 15.0, 6.5345, 0.5));
            breathParameters.pushBack(new BreathParameterData(this._idParamAngleY, 0.0, 8.0, 3.5345, 0.5));
            breathParameters.pushBack(new BreathParameterData(this._idParamAngleZ, 0.0, 10.0, 5.5345, 0.5));
            breathParameters.pushBack(new BreathParameterData(this._idParamBodyAngleX, 0.0, 4.0, 15.5345, 0.5));
            breathParameters.pushBack(new BreathParameterData(CubismFramework.getIdManager().getId(CubismDefaultParameterId.ParamBreath), 0.0, 0.5, 3.2345, 0.5));

            this._breath.setParameters(breathParameters);
            this._state = LoadStep.LoadUserData;

            // callback
            loadUserData();
        };

        // UserData
        let loadUserData = () => {
            if (this._modelSetting.getUserDataFile() != "") {
                let path: string = this._modelSetting.getUserDataFile();
                path = this._modelHomeDir + path;

                fetch(path).then(
                    (response) => {
                        return response.arrayBuffer();
                    }
                ).then(
                    (arrayBuffer) => {
                        let buffer: ArrayBuffer = arrayBuffer;
                        let size: number = buffer.byteLength;

                        this.loadUserData(buffer, size);
                        deleteBuffer(buffer, path);

                        this._state = LoadStep.SetupEyeBlinkIds;

                        // callback
                        setupEyeBlinkIds();
                    }
                );

                this._state = LoadStep.WaitLoadUserData;
            } else {
                this._state = LoadStep.SetupEyeBlinkIds;

                // callback
                setupEyeBlinkIds();
            }
        };

        // EyeBlinkIds
        let setupEyeBlinkIds = () => {
            let eyeBlinkIdCount: number = this._modelSetting.getEyeBlinkParameterCount();

            for (let i: number = 0; i < eyeBlinkIdCount; ++i) {
                this._eyeBlinkIds.pushBack(this._modelSetting.getEyeBlinkParameterId(i));
            }

            this._state = LoadStep.SetupLipSyncIds;

            // callback
            setupLipSyncIds();
        };

        // LipSyncIds
        let setupLipSyncIds = () => {
            let lipSyncIdCount = this._modelSetting.getLipSyncParameterCount();

            for (let i: number = 0; i < lipSyncIdCount; ++i) {
                this._lipSyncIds.pushBack(this._modelSetting.getLipSyncParameterId(i));
            }
            this._state = LoadStep.SetupLayout;

            // callback
            setupLayout();
        };

        // Layout
        let setupLayout = () => {
            let layout: csmMap<string, number> = new csmMap<string, number>();
            this._modelSetting.getLayoutMap(layout);
            this._modelMatrix.setupFromLayout(layout);
            this._state = LoadStep.LoadMotion;

            // callback
            loadCubismMotion();
        };

        // Motion
        let loadCubismMotion = () => {
            this._state = LoadStep.WaitLoadMotion;
            this._model.saveParameters();
            this._allMotionCount = 0;
            this._motionCount = 0;
            let group: string[] = [];

            let motionGroupCount: number = this._modelSetting.getMotionGroupCount();

            // motion总数
            for (let i: number = 0; i < motionGroupCount; i++) {
                group[i] = this._modelSetting.getMotionGroupName(i);
                this._allMotionCount += this._modelSetting.getMotionCount(group[i]);
            }

            // 读取motion
            for (let i: number = 0; i < motionGroupCount; i++) {
                this.preLoadMotionGroup(group[i]);
            }

            // 若没有motion
            if (motionGroupCount == 0) {
                this._state = LoadStep.LoadTexture;
                this._motionManager.stopAllMotions();

                this._updating = false;
                this._initialized = true;

                this.createRenderer();
                this.setupTextures();
                this.getRenderer().startUp(gl);
            }
        };
    }

    private setupTextures(): void {
        // 为了试iPhone的alpha有更好的效果使用premultipliedAlpha
        let usePremultiply: boolean = true;

        if (this._state == LoadStep.LoadTexture) {
            let textureCount: number = this._modelSetting.getTextureCount();
            for (let modelTextureNumber = 0; modelTextureNumber < textureCount; modelTextureNumber++) {
                if (this._modelSetting.getTextureFileName(modelTextureNumber) == "") {
                    continue;
                }

                // 读取live2d的材质图
                let texturePath = this._modelSetting.getTextureFileName(modelTextureNumber);
                texturePath = this._modelHomeDir + texturePath;

                let onLoad = (textureInfo: TextureInfo): void => {
                    this.getRenderer().bindTexture(modelTextureNumber, textureInfo.id);
                    this._textureCount++;
                    if (this._textureCount >= textureCount) {
                        this._state = LoadStep.CompleteSetup;
                    }
                };
                LAppDelegate.getInstance().getTextureManager().createTextureFromPngFile(texturePath, usePremultiply, onLoad);
                this.getRenderer().setIsPremultipliedAlpha(usePremultiply);
            }

            this._state = LoadStep.WaitLoadTexture;
        }
    }

    public reloadRenderer(): void {
        this.deleteRenderer();
        this.createRenderer();
        this.setupTextures();
    }

    public update(): void {
        if (this._state != LoadStep.CompleteSetup) return;

        const deltaTimeSeconds: number = LAppPal.getDeltaTime();
        this._userTimeSeconds += deltaTimeSeconds;

        this._dragManager.update(deltaTimeSeconds);
        this._dragX = this._dragManager.getX();
        this._dragY = this._dragManager.getY();

        let motionUpdated = false;

        //--------------------------------------------------------------------------
        this._model.loadParameters();
        if (this._motionManager.isFinished()) {
            // motion完事就随机触发idle motion
            let nowTs: number = Math.floor(new Date().getTime() / 1000);
            if (nowTs % 17 == 0) {
                this.startRandomMotion(LAppDefine.MotionGroupIdle, LAppDefine.PriorityIdle);
            } else {
                this.startMotion(LAppDefine.MotionGroupTapDefault, 0, LAppDefine.PriorityIdle)
            }
        } else {
            motionUpdated = this._motionManager.updateMotion(this._model, deltaTimeSeconds);   // 更新motion
        }
        this._model.saveParameters();
        //--------------------------------------------------------------------------

        if (!motionUpdated) {
            if (this._eyeBlink != null) {
                this._eyeBlink.updateParameters(this._model, deltaTimeSeconds); // 眨眼
            }
        }
        if (this._expressionManager != null) {
            this._expressionManager.updateMotion(this._model, deltaTimeSeconds);
        }

        // 通过drag来调整脸部方向
        this._model.addParameterValueById(this._idParamAngleX, this._dragX * 30);  // -30~30
        this._model.addParameterValueById(this._idParamAngleY, this._dragY * 30);
        this._model.addParameterValueById(this._idParamAngleZ, this._dragX * this._dragY * -30);
        // 通过drag来调整身体方向
        this._model.addParameterValueById(this._idParamBodyAngleX, this._dragX * 10);  // -10~10
        // 通过drag来调整眼睛方向
        this._model.addParameterValueById(this._idParamEyeBallX, this._dragX); // -1~1
        this._model.addParameterValueById(this._idParamEyeBallY, this._dragY);

        // 呼吸
        if (this._breath != null) {
            this._breath.updateParameters(this._model, deltaTimeSeconds);
        }

        // 物理设置
        if (this._physics != null) {
            this._physics.evaluate(this._model, deltaTimeSeconds);
        }

        if (this._lipsync) {
            let value: number = 0;  // lipSync通过系统获取音量并输入0到1之间的值

            for (let i: number = 0; i < this._lipSyncIds.getSize(); ++i) {
                this._model.addParameterValueById(this._lipSyncIds.at(i), value, 0.8);
            }
        }

        if (this._pose != null) {
            this._pose.updateParameters(this._model, deltaTimeSeconds);
        }

        this._model.update();
    }

    /**
     * start motion
     */
    public startMotion(group: string, no: number, priority: number): CubismMotionQueueEntryHandle {
        if (priority == LAppDefine.PriorityForce) {
            this._motionManager.setReservePriority(priority);
        } else if (!this._motionManager.reserveMotion(priority)) {
            if (this._debugMode) {
                LAppPal.printLog("[APP]can't start motion.");
            }
            return InvalidMotionQueueEntryHandleValue;
        }

        const fileName: string = this._modelSetting.getMotionFileName(group, no);

        // ex) idle_0
        let name: string = CubismString.getFormatedString("{0}_{1}", group, no);
        let motion: CubismMotion = <CubismMotion>this._motions.getValue(name);
        let autoDelete: boolean = false;

        if (motion == null) {
            let path: string = fileName;
            path = this._modelHomeDir + path;

            fetch(path).then(
                (response) => {
                    return response.arrayBuffer();
                }
            ).then(
                (arrayBuffer) => {
                    let buffer: ArrayBuffer = arrayBuffer;
                    let size = buffer.byteLength;

                    motion = <CubismMotion>this.loadMotion(buffer, size, null);
                    let fadeTime: number = this._modelSetting.getMotionFadeInTimeValue(group, no);

                    if (fadeTime >= 0.0) {
                        motion.setFadeInTime(fadeTime);
                    }

                    fadeTime = this._modelSetting.getMotionFadeOutTimeValue(group, no);
                    if (fadeTime >= 0.0) {
                        motion.setFadeOutTime(fadeTime);
                    }

                    motion.setEffectIds(this._eyeBlinkIds, this._lipSyncIds);
                    autoDelete = true;

                    deleteBuffer(buffer, path);
                }
            );
        }

        if (this._debugMode) {
            LAppPal.printLog("[APP]start motion: [{0}_{1}", group, no);
        }
        return this._motionManager.startMotionPriority(motion, autoDelete, priority);
    }

    public startRandomMotion(group: string, priority: number): CubismMotionQueueEntryHandle {
        if (this._modelSetting.getMotionCount(group) == 0) {
            return InvalidMotionQueueEntryHandleValue;
        }

        let no: number = Math.floor(Math.random() * this._modelSetting.getMotionCount(group));

        return this.startMotion(group, no, priority);
    }

    public setExpression(expressionId: string): void {
        let motion: ACubismMotion = this._expressions.getValue(expressionId);

        if (this._debugMode) {
            LAppPal.printLog("[APP]expression: [{0}]", expressionId);
        }

        if (motion != null) {
            this._expressionManager.startMotionPriority(motion, false, LAppDefine.PriorityForce);
        } else {
            if (this._debugMode) {
                LAppPal.printLog("[APP]expression[{0}] is null", expressionId);
            }
        }
    }

    public setRandomExpression(): void {
        if (this._expressions.getSize() == 0) {
            return;
        }

        let no: number = Math.floor(Math.random() * this._expressions.getSize());

        for (let i: number = 0; i < this._expressions.getSize(); i++) {
            if (i == no) {
                let name: string = this._expressions._keyValues[i].first;
                this.setExpression(name);
                return;
            }
        }
    }

    /**
     * 生气
     */
    public motionEventFired(eventValue: csmString): void {
        CubismLogInfo("{0} is fired on LAppModel!!", eventValue.s);
    }

    public hitTest(hitArenaName: string, x: number, y: number): boolean {
        // 透明则直接返回
        if (this._opacity < 1) {
            return false;
        }
        const count: number = this._modelSetting.getHitAreasCount();
        for (let i: number = 0; i < count; i++) {
            if (this._modelSetting.getHitAreaName(i) == hitArenaName) {
                const drawId: CubismIdHandle = this._modelSetting.getHitAreaId(i);
                return this.isHit(drawId, x, y);
            }
        }

        return false;
    }

    public preLoadMotionGroup(group: string): void {
        for (let i: number = 0; i < this._modelSetting.getMotionCount(group); i++) {
            // ex) idle_0
            let name: string = CubismString.getFormatedString("{0}_{1}", group, i);
            let path = this._modelSetting.getMotionFileName(group, i);
            path = this._modelHomeDir + path;

            if (this._debugMode) {
                LAppPal.printLog("[APP]load motion: {0} => [{1}_{2}]", path, group, i);
            }

            fetch(path).then(
                (response) => {
                    return response.arrayBuffer();
                }
            ).then(
                (arrayBuffer) => {
                    let buffer: ArrayBuffer = arrayBuffer;
                    let size = buffer.byteLength;

                    let tmpMotion: CubismMotion = <CubismMotion>this.loadMotion(buffer, size, name);

                    let fadeTime = this._modelSetting.getMotionFadeInTimeValue(group, i);
                    if (fadeTime >= 0.0) {
                        tmpMotion.setFadeInTime(fadeTime);
                    }

                    fadeTime = this._modelSetting.getMotionFadeOutTimeValue(group, i);
                    if (fadeTime >= 0.0) {
                        tmpMotion.setFadeOutTime(fadeTime);
                    }
                    tmpMotion.setEffectIds(this._eyeBlinkIds, this._lipSyncIds);

                    if (this._motions.getValue(name) != null) {
                        ACubismMotion.delete(this._motions.getValue(name));
                    }

                    this._motions.setValue(name, tmpMotion);

                    deleteBuffer(buffer, path);

                    this._motionCount++;
                    if (this._motionCount >= this._allMotionCount) {
                        this._state = LoadStep.LoadTexture;
                        this._motionManager.stopAllMotions();
                        this._updating = false;
                        this._initialized = true;

                        this.createRenderer();
                        this.setupTextures();
                        this.getRenderer().startUp(gl);
                    }
                }
            );
        }
    }

    public releaseMotions(): void {
        this._motions.clear();
    }

    public releaseExpressions(): void {
        this._expressions.clear();
    }

    /**
     * 绘制model 通过绘制模型的空间的View-Projection矩阵
     */
    public doDraw(): void {
        if (this._model == null) return;
        let viewport: number[] = [0, 0, canvas.width, canvas.height];
        this.getRenderer().setRenderState(frameBuffer, viewport);
        this.getRenderer().drawModel();
    }

    public draw(matrix: CubismMatrix44): void {
        if (this._model == null) {
            return;
        }
        /* 所有配置读完就可以开始绘制 */
        if (this._state == LoadStep.CompleteSetup) {
            matrix.multiplyByMatrix(this._modelMatrix);
            this.getRenderer().setMvpMatrix(matrix);
            this.doDraw();
        }
    }

    public constructor() {
        super();

        this._modelSetting = null;
        this._modelHomeDir = null;
        this._userTimeSeconds = 0.0;

        this._eyeBlinkIds = new csmVector<CubismIdHandle>();
        this._lipSyncIds = new csmVector<CubismIdHandle>();

        this._motions = new csmMap<string, ACubismMotion>();
        this._expressions = new csmMap<string, ACubismMotion>();

        this._hitArea = new csmVector<csmRect>();
        this._userArea = new csmVector<csmRect>();

        const isCafeGun: boolean = true;
        if (isCafeGun) { // 双生视界的Paramid定义比较奇葩, 需要单独处理
            this._idParamAngleX = CubismFramework.getIdManager().getId(CafeGunGirlParam.ParamAngleX);
            this._idParamAngleY = CubismFramework.getIdManager().getId(CafeGunGirlParam.ParamAngleY);
            this._idParamAngleZ = CubismFramework.getIdManager().getId(CafeGunGirlParam.ParamAngleZ);
            this._idParamEyeBallX = CubismFramework.getIdManager().getId(CafeGunGirlParam.ParamEyeBallX);
            this._idParamEyeBallY = CubismFramework.getIdManager().getId(CafeGunGirlParam.ParamEyeBallY);
            this._idParamBodyAngleX = CubismFramework.getIdManager().getId(CafeGunGirlParam.ParamBodyAngleX);
        } else {
            this._idParamAngleX = CubismFramework.getIdManager().getId(CubismDefaultParameterId.ParamAngleX);
            this._idParamAngleY = CubismFramework.getIdManager().getId(CubismDefaultParameterId.ParamAngleY);
            this._idParamAngleZ = CubismFramework.getIdManager().getId(CubismDefaultParameterId.ParamAngleZ);
            this._idParamEyeBallX = CubismFramework.getIdManager().getId(CubismDefaultParameterId.ParamEyeBallX);
            this._idParamEyeBallY = CubismFramework.getIdManager().getId(CubismDefaultParameterId.ParamEyeBallY);
            this._idParamBodyAngleX = CubismFramework.getIdManager().getId(CubismDefaultParameterId.ParamBodyAngleX);
        }
        this._state = LoadStep.LoadAssets;
        this._expressionCount = 0;
        this._textureCount = 0;
        this._motionCount = 0;
        this._allMotionCount = 0;
    }

    _modelSetting: ICubismModelSetting;
    _modelHomeDir: string;
    _userTimeSeconds: number;

    _eyeBlinkIds: csmVector<CubismIdHandle>;
    _lipSyncIds: csmVector<CubismIdHandle>;

    _motions: csmMap<string, ACubismMotion>;// 从motions中读取出的motion实例
    _expressions: csmMap<string, ACubismMotion>;    // 从expression中读取出的expression实例

    _hitArea: csmVector<csmRect>;
    _userArea: csmVector<csmRect>;

    _idParamAngleX: CubismIdHandle;
    _idParamAngleY: CubismIdHandle;
    _idParamAngleZ: CubismIdHandle;
    _idParamEyeBallX: CubismIdHandle;
    _idParamEyeBallY: CubismIdHandle;
    _idParamBodyAngleX: CubismIdHandle;

    _state: number;
    _expressionCount: number;
    _textureCount: number;
    _motionCount: number;
    _allMotionCount: number;
}
