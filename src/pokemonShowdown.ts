import { PokeAPI } from "./pokeAPI";
import { getDamageRelationsForTypes } from "./calc";

export namespace PokemonShowdown {
  const TYPE_IMAGE_WIDTH = 32;
  const TYPE_IMAGE_HEIGHT = 14;
  export const TOOLTIP_CONTAINER_ID = "tooltipwrapper";
  export const POKEMON_TOOLTIP_SELECTOR =
    ".tooltip-pokemon, .tooltip-activepokemon";

  function getTypeImageSrc(type: string) {
    return `https://play.pokemonshowdown.com/sprites/types/${type}.png`;
  }

  /**
   * @param {string} type
   * @returns An HTML img element for the supplied type
   */
  function getTypeImageElement(type: string): HTMLImageElement {
    const showdownTypeName = `${type.charAt(0).toUpperCase()}${type
      .toLowerCase()
      .slice(1)}`;

    const src = getTypeImageSrc(showdownTypeName);
    const image = document.createElement("img");

    image.setAttribute("alt", showdownTypeName);
    image.setAttribute("src", src);
    image.setAttribute("width", TYPE_IMAGE_WIDTH.toString());
    image.setAttribute("height", TYPE_IMAGE_HEIGHT.toString());
    image.classList.add("pixelated");

    return image;
  }

  /**
   * Fetches the list of types from the passed tooltip element.
   * @param tooltipElement
   * @returns The list of types found in the tooltip element.
   */
  function getTypes(tooltipElement: Element): string[] {
    const images = Array.from(
      tooltipElement.querySelectorAll("img")
    ) as HTMLImageElement[];
    return images
      .filter((image) => image.getAttribute("width") === "32")
      .map((image) => image.getAttribute("alt")!.toLowerCase());
  }

  /**
   * Injects the type damage relations into the passed tooltip element.
   * @param tooltipElement
   */
  export async function modifyTooltip(
    pokeAPIClient: PokeAPI.PokeAPIClient,
    tooltipElement: HTMLElement
  ) {
    const headerNode = tooltipElement.querySelector("h2");

    if (headerNode === null || headerNode.parentNode === null) {
      console.error(
        "Failed to inject type information; Showdown update may have broken this."
      );
      return;
    }

    const types = getTypes(tooltipElement);
    const {from, to} = await getDamageRelationsForTypes(
      pokeAPIClient,
      types
    );

    const sortedDamageRelationsFrom = Array.from(from.keys());
    const sortedDamageRelationsTo = Array.from(to.keys());



    for (const damageMultiplier of sortedDamageRelationsFrom) {
      const types = from.get(damageMultiplier);
      const resistanceValueElement = document.createElement("p");
      const resistanceValueText = document.createElement("small");

      resistanceValueText.innerText = `Loss x${damageMultiplier}: `;

      resistanceValueElement.appendChild(resistanceValueText);
      for (let type of types!) {
        resistanceValueElement.appendChild(getTypeImageElement(type));
      }

      headerNode.parentNode.insertBefore(
        resistanceValueElement,
        null
      );
    }


    for (const damageMultiplier of sortedDamageRelationsTo) {
      const types = to.get(damageMultiplier);
      const resistanceValueElement = document.createElement("p");
      const resistanceValueText = document.createElement("small");

      resistanceValueText.innerText = `Win x${damageMultiplier}: `;

      resistanceValueElement.appendChild(resistanceValueText);
      for (let type of types!) {
        resistanceValueElement.appendChild(getTypeImageElement(type));
      }

      headerNode.parentNode.insertBefore(
        resistanceValueElement,
        null
      );
    }

    // Remove CSS top property to force tooltips to always render below the mouse
    // This prevents the added types from causing the tooltip to go offscreen.
    tooltipElement.parentElement!.parentElement!.style.top = "";
  }
}
