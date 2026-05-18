declare module 'vanta/dist/vanta.clouds.min' {
    type VantaCloudsOptions = {
        el: HTMLElement;
        THREE?: unknown;
        mouseControls?: boolean;
        touchControls?: boolean;
        gyroControls?: boolean;
        minHeight?: number;
        minWidth?: number;
        backgroundColor?: number;
        skyColor?: number;
        cloudColor?: number;
        cloudShadowColor?: number;
        sunColor?: number;
        sunGlareColor?: number;
        sunlightColor?: number;
        speed?: number;
    };

    type VantaEffect = {
        destroy: () => void;
        resize?: () => void;
        setOptions?: (options: Partial<VantaCloudsOptions>) => void;
    };

    export default function CLOUDS(options: VantaCloudsOptions): VantaEffect;
}
