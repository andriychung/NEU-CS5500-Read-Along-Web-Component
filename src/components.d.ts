/* eslint-disable */
/* tslint:disable */
/**
 * This is an autogenerated file created by the Stencil compiler.
 * It contains typing information for all components that exist in this project.
 */
import { HTMLStencilElement, JSXBase } from "@stencil/core/internal";
export namespace Components {
    interface ReadAlong {
        /**
          * The alignment as SMIL
         */
        "alignment": string;
        /**
          * The audio file
         */
        "audio": string;
        /**
          * Stylesheet
         */
        "css_url"?: string;
        /**
          * Language
         */
        "language": string;
        /**
          * Overlay This is an SVG overlay to place over the progress bar
         */
        "svg_overlay": string;
        /**
          * The text as TEI
         */
        "text": string;
        /**
          * Theme to use: ['light', 'dark'] defaults to 'dark'
         */
        "theme": string;
    }
}
declare global {
    interface HTMLReadAlongElement extends Components.ReadAlong, HTMLStencilElement {
    }
    var HTMLReadAlongElement: {
        prototype: HTMLReadAlongElement;
        new (): HTMLReadAlongElement;
    };
    interface HTMLElementTagNameMap {
        "read-along": HTMLReadAlongElement;
    }
}
declare namespace LocalJSX {
    interface ReadAlong {
        /**
          * The alignment as SMIL
         */
        "alignment"?: string;
        /**
          * The audio file
         */
        "audio"?: string;
        /**
          * Stylesheet
         */
        "css_url"?: string;
        /**
          * Language
         */
        "language"?: string;
        /**
          * Overlay This is an SVG overlay to place over the progress bar
         */
        "svg_overlay"?: string;
        /**
          * The text as TEI
         */
        "text"?: string;
        /**
          * Theme to use: ['light', 'dark'] defaults to 'dark'
         */
        "theme"?: string;
    }
    interface IntrinsicElements {
        "read-along": ReadAlong;
    }
}
export { LocalJSX as JSX };
declare module "@stencil/core" {
    export namespace JSX {
        interface IntrinsicElements {
            "read-along": LocalJSX.ReadAlong & JSXBase.HTMLAttributes<HTMLReadAlongElement>;
        }
    }
}
