declare module 'react-d3-tree' {
    import { ReactElement } from 'react';

    export interface TreeProps {
        data: any[];
        orientation?: 'vertical' | 'horizontal';
        pathFunc?: 'diagonal' | 'elbow' | 'straight' | 'step';
        translate?: { x: number; y: number };
        separation?: { siblings: number; nonSiblings: number };
        renderCustomNodeElement?: (props: any) => ReactElement;
        nodeSize?: { x: number; y: number };
        zoomable?: boolean;
        zoom?: number;
        scaleExtent?: { min: number; max: number };
        renderLabel?: (data: any) => ReactElement;
    }

    export class Tree extends React.Component<TreeProps> {}
} 