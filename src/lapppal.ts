/* 通用工具 */
export class LAppPal {
    public static loadFileAsBytes(filePath: string, callback: any): void {
        const path: string = filePath;
        let size = 0;
        fetch(path).then(
            (response) => {
                return response.arrayBuffer();
            }
        ).then(
            (arrayBuffer) => {
                size = arrayBuffer.byteLength;
                callback(arrayBuffer, size);
            }
        );
    }

    public static releaseBytes(byteData: ArrayBuffer): void {
        byteData = void 0;
    }

    public static getDeltaTime(): number {
        return this.s_deltaTime;
    }

    public static updateTime(): void {
        this.s_currentFrame = Date.now();
        this.s_deltaTime = (this.s_currentFrame - this.s_lastFrame) / 1000;
        this.s_lastFrame = this.s_currentFrame;
    }

    public static printLog(format: string, ...args: any[]): void {
        console.log(format.replace(/\{(\d+)\}/g, (m, k) => {
            return args[k];
        }));
    }

    public static printMessage(message: string): void {
        LAppPal.printLog(message);
    }

    static s_currentFrame = 0.0;
    static s_lastFrame = 0.0;
    static s_deltaTime = 0.0;
}
