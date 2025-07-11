declare module '@tauri-apps/api/tauri' {
    export function invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T>;
}

declare module '@tauri-apps/api/window' {
    export interface PhysicalPosition {
        x: number;
        y: number;
    }

    export interface PhysicalSize {
        width: number;
        height: number;
    }

    export interface Window {
        setSize(size: PhysicalSize): Promise<void>;
        setPosition(position: PhysicalPosition): Promise<void>;
        maximize(): Promise<void>;
        isMaximized(): Promise<boolean>;
        outerPosition(): Promise<PhysicalPosition>;
        outerSize(): Promise<PhysicalSize>;
        scaleFactor(): Promise<number>;
    }
} 