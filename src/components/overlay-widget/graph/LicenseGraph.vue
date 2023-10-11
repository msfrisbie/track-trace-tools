<template>
  <div>
    <template v-if="inflight">
      <div class="absolute top-0 w-full">
        <div class="flex flex-row items-center justify-center">
          <span>Loading packages...</span>
          <b-spinner small></b-spinner>
        </div>
      </div>
    </template>
    <div id="sigma-container"></div>
    <div id="search">
      <input
        type="search"
        id="search-input"
        list="suggestions"
        placeholder="Try searching for a node..."
      />
      <datalist id="suggestions">
        <option v-for="node of data.nodes" v-bind:key="node.label" :value="node.label"></option>
      </datalist>
    </div>
  </div>
</template>

<script lang="ts">
import { primaryDataLoader } from "@/modules/data-loader/data-loader.module";
import router from "@/router/index";
import store from "@/store/page-overlay/index";
import Graph from "graphology";
import Sigma from "sigma";
// import getNodeProgramImage from "sigma/rendering/webgl/programs/node.image";
import { Settings } from "sigma/settings";
import {
  Coordinates,
  EdgeDisplayData,
  NodeDisplayData,
  PartialButFor,
  PlainObject,
} from "sigma/types";
import Vue from "vue";
import { mapState } from "vuex";
// import NodeProgramBorder from "./node.border";

const TEXT_COLOR = "#000000";

function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

interface GraphData {
  nodes: {
    key: string;
    attributes: {
      size: number;
      label: string;
      color: string;
    };
  }[];
  edges: {
    key: string;
    source: string;
    target: string;
    attributes: { type: "arrow"; label: string; size: number };
  }[];
}

const data: GraphData = {
  nodes: [
    {
      key: "0.0",
      attributes: {
        size: 4,
        label: "Myriel",
        color: "#D8482D",
      },
    },
    {
      key: "1.0",
      attributes: {
        size: 4,
        label: "Napoleon",
        color: "#B30000",
      },
    },
    {
      key: "2.0",
      attributes: {
        size: 4,
        label: "MlleBaptistine",
        color: "#BB100A",
      },
    },
    {
      key: "3.0",
      attributes: {
        size: 4,
        label: "MmeMagloire",
        color: "#BB100A",
      },
    },
    {
      key: "4.0",
      attributes: {
        size: 4,
        label: "CountessDeLo",
        color: "#B30000",
      },
    },
    {
      key: "5.0",
      attributes: {
        size: 4,
        label: "Geborand",
        color: "#B30000",
      },
    },
    {
      key: "6.0",
      attributes: {
        size: 4,
        label: "Champtercier",
        color: "#B30000",
      },
    },
    {
      key: "7.0",
      attributes: {
        size: 4,
        label: "Cravatte",
        color: "#B30000",
      },
    },
    {
      key: "8.0",
      attributes: {
        size: 4,
        label: "Count",
        color: "#B30000",
      },
    },
    {
      key: "9.0",
      attributes: {
        size: 4,
        label: "OldMan",
        color: "#B30000",
      },
    },
    {
      key: "10.0",
      attributes: {
        size: 4,
        label: "Labarre",
        color: "#B30000",
      },
    },
    {
      key: "11.0",
      attributes: {
        size: 4,
        label: "Valjean",
        color: "#FEF0D9",
      },
    },
    {
      key: "12.0",
      attributes: {
        size: 4,
        label: "Marguerite",
        color: "#B70805",
      },
    },
    {
      key: "13.0",
      attributes: {
        size: 4,
        label: "MmeDeR",
        color: "#B30000",
      },
    },
    {
      key: "14.0",
      attributes: {
        size: 4,
        label: "Isabeau",
        color: "#B30000",
      },
    },
    {
      key: "15.0",
      attributes: {
        size: 4,
        label: "Gervais",
        color: "#B30000",
      },
    },
    {
      key: "16.0",
      attributes: {
        size: 4,
        label: "Tholomyes",
        color: "#D44028",
      },
    },
    {
      key: "17.0",
      attributes: {
        size: 4,
        label: "Listolier",
        color: "#CC301E",
      },
    },
    {
      key: "18.0",
      attributes: {
        size: 4,
        label: "Fameuil",
        color: "#CC301E",
      },
    },
    {
      key: "19.0",
      attributes: {
        size: 4,
        label: "Blacheville",
        color: "#CC301E",
      },
    },
    {
      key: "20.0",
      attributes: {
        size: 4,
        label: "Favourite",
        color: "#CC301E",
      },
    },
    {
      key: "21.0",
      attributes: {
        size: 4,
        label: "Dahlia",
        color: "#CC301E",
      },
    },
    {
      key: "22.0",
      attributes: {
        size: 4,
        label: "Zephine",
        color: "#CC301E",
      },
    },
    {
      key: "23.0",
      attributes: {
        size: 4,
        label: "Fantine",
        color: "#ED7047",
      },
    },
    {
      key: "24.0",
      attributes: {
        size: 4,
        label: "MmeThenardier",
        color: "#DC5032",
      },
    },
    {
      key: "25.0",
      attributes: {
        size: 4,
        label: "Thenardier",
        color: "#F1784C",
      },
    },
    {
      key: "26.0",
      attributes: {
        size: 4,
        label: "Cosette",
        color: "#DC5032",
      },
    },
    {
      key: "27.0",
      attributes: {
        size: 4,
        label: "Javert",
        color: "#F58051",
      },
    },
    {
      key: "28.0",
      attributes: {
        size: 4,
        label: "Fauchelevent",
        color: "#BF180F",
      },
    },
    {
      key: "29.0",
      attributes: {
        size: 4,
        label: "Bamatabois",
        color: "#D03823",
      },
    },
    {
      key: "30.0",
      attributes: {
        size: 4,
        label: "Perpetue",
        color: "#B70805",
      },
    },
    {
      key: "31.0",
      attributes: {
        size: 4,
        label: "Simplice",
        color: "#BF180F",
      },
    },
    {
      key: "32.0",
      attributes: {
        size: 4,
        label: "Scaufflaire",
        color: "#B30000",
      },
    },
    {
      key: "33.0",
      attributes: {
        size: 4,
        label: "Woman1",
        color: "#B70805",
      },
    },
    {
      key: "34.0",
      attributes: {
        size: 4,
        label: "Judge",
        color: "#C72819",
      },
    },
    {
      key: "35.0",
      attributes: {
        size: 4,
        label: "Champmathieu",
        color: "#C72819",
      },
    },
    {
      key: "36.0",
      attributes: {
        size: 4,
        label: "Brevet",
        color: "#C72819",
      },
    },
    {
      key: "37.0",
      attributes: {
        size: 4,
        label: "Chenildieu",
        color: "#C72819",
      },
    },
    {
      key: "38.0",
      attributes: {
        size: 4,
        label: "Cochepaille",
        color: "#C72819",
      },
    },
    {
      key: "39.0",
      attributes: {
        size: 4,
        label: "Pontmercy",
        color: "#BB100A",
      },
    },
    {
      key: "40.0",
      attributes: {
        size: 4,
        label: "Boulatruelle",
        color: "#B30000",
      },
    },
    {
      key: "41.0",
      attributes: {
        size: 4,
        label: "Eponine",
        color: "#DC5032",
      },
    },
    {
      key: "42.0",
      attributes: {
        size: 4,
        label: "Anzelma",
        color: "#BB100A",
      },
    },
    {
      key: "43.0",
      attributes: {
        size: 4,
        label: "Woman2",
        color: "#BB100A",
      },
    },
    {
      key: "44.0",
      attributes: {
        size: 4,
        label: "MotherInnocent",
        color: "#B70805",
      },
    },
    {
      key: "45.0",
      attributes: {
        size: 4,
        label: "Gribier",
        color: "#B30000",
      },
    },
    {
      key: "46.0",
      attributes: {
        size: 4,
        label: "Jondrette",
        color: "#B30000",
      },
    },
    {
      key: "47.0",
      attributes: {
        size: 4,
        label: "MmeBurgon",
        color: "#B70805",
      },
    },
    {
      key: "48.0",
      attributes: {
        size: 4,
        label: "Gavroche",
        color: "#FCA072",
      },
    },
    {
      key: "49.0",
      attributes: {
        size: 4,
        label: "Gillenormand",
        color: "#CC301E",
      },
    },
    {
      key: "50.0",
      attributes: {
        size: 4,
        label: "Magnon",
        color: "#B70805",
      },
    },
    {
      key: "51.0",
      attributes: {
        size: 4,
        label: "MlleGillenormand",
        color: "#CC301E",
      },
    },
    {
      key: "52.0",
      attributes: {
        size: 4,
        label: "MmePontmercy",
        color: "#B70805",
      },
    },
    {
      key: "53.0",
      attributes: {
        size: 4,
        label: "MlleVaubois",
        color: "#B30000",
      },
    },
    {
      key: "54.0",
      attributes: {
        size: 4,
        label: "LtGillenormand",
        color: "#BF180F",
      },
    },
    {
      key: "55.0",
      attributes: {
        size: 4,
        label: "Marius",
        color: "#FC8F5C",
      },
    },
    {
      key: "56.0",
      attributes: {
        size: 4,
        label: "BaronessT",
        color: "#B70805",
      },
    },
    {
      key: "57.0",
      attributes: {
        size: 4,
        label: "Mabeuf",
        color: "#DC5032",
      },
    },
    {
      key: "58.0",
      attributes: {
        size: 4,
        label: "Enjolras",
        color: "#ED7047",
      },
    },
    {
      key: "59.0",
      attributes: {
        size: 4,
        label: "Combeferre",
        color: "#DC5032",
      },
    },
    {
      key: "60.0",
      attributes: {
        size: 4,
        label: "Prouvaire",
        color: "#D44028",
      },
    },
    {
      key: "61.0",
      attributes: {
        size: 4,
        label: "Feuilly",
        color: "#DC5032",
      },
    },
    {
      key: "62.0",
      attributes: {
        size: 4,
        label: "Courfeyrac",
        color: "#E5603D",
      },
    },
    {
      key: "63.0",
      attributes: {
        size: 4,
        label: "Bahorel",
        color: "#E05837",
      },
    },
    {
      key: "64.0",
      attributes: {
        size: 4,
        label: "Bossuet",
        color: "#E5603D",
      },
    },
    {
      key: "65.0",
      attributes: {
        size: 4,
        label: "Joly",
        color: "#E05837",
      },
    },
    {
      key: "66.0",
      attributes: {
        size: 4,
        label: "Grantaire",
        color: "#D8482D",
      },
    },
    {
      key: "67.0",
      attributes: {
        size: 4,
        label: "MotherPlutarch",
        color: "#B30000",
      },
    },
    {
      key: "68.0",
      attributes: {
        size: 4,
        label: "Gueulemer",
        color: "#D8482D",
      },
    },
    {
      key: "69.0",
      attributes: {
        size: 4,
        label: "Babet",
        color: "#D8482D",
      },
    },
    {
      key: "70.0",
      attributes: {
        size: 4,
        label: "Claquesous",
        color: "#D8482D",
      },
    },
    {
      key: "71.0",
      attributes: {
        size: 4,
        label: "Montparnasse",
        color: "#D44028",
      },
    },
    {
      key: "72.0",
      attributes: {
        size: 4,
        label: "Toussaint",
        color: "#BB100A",
      },
    },
    {
      key: "73.0",
      attributes: {
        size: 4,
        label: "Child1",
        color: "#B70805",
      },
    },
    {
      key: "74.0",
      attributes: {
        size: 4,
        label: "Child2",
        color: "#B70805",
      },
    },
    {
      key: "75.0",
      attributes: {
        size: 4,
        label: "Brujon",
        color: "#CC301E",
      },
    },
    {
      key: "76.0",
      attributes: {
        size: 4,
        label: "MmeHucheloup",
        color: "#CC301E",
      },
    },
  ],
  edges: [
    {
      key: "0",
      source: "1.0",
      target: "0.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "1",
      source: "2.0",
      target: "0.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "2",
      source: "3.0",
      target: "0.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "3",
      source: "3.0",
      target: "2.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "4",
      source: "4.0",
      target: "0.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "5",
      source: "5.0",
      target: "0.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "6",
      source: "6.0",
      target: "0.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "7",
      source: "7.0",
      target: "0.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "8",
      source: "8.0",
      target: "0.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "9",
      source: "9.0",
      target: "0.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "13",
      source: "11.0",
      target: "0.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "12",
      source: "11.0",
      target: "2.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "11",
      source: "11.0",
      target: "3.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "10",
      source: "11.0",
      target: "10.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "14",
      source: "12.0",
      target: "11.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "15",
      source: "13.0",
      target: "11.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "16",
      source: "14.0",
      target: "11.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "17",
      source: "15.0",
      target: "11.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "18",
      source: "17.0",
      target: "16.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "19",
      source: "18.0",
      target: "16.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "20",
      source: "18.0",
      target: "17.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "21",
      source: "19.0",
      target: "16.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "22",
      source: "19.0",
      target: "17.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "23",
      source: "19.0",
      target: "18.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "24",
      source: "20.0",
      target: "16.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "25",
      source: "20.0",
      target: "17.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "26",
      source: "20.0",
      target: "18.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "27",
      source: "20.0",
      target: "19.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "28",
      source: "21.0",
      target: "16.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "29",
      source: "21.0",
      target: "17.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "30",
      source: "21.0",
      target: "18.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "31",
      source: "21.0",
      target: "19.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "32",
      source: "21.0",
      target: "20.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "33",
      source: "22.0",
      target: "16.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "34",
      source: "22.0",
      target: "17.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "35",
      source: "22.0",
      target: "18.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "36",
      source: "22.0",
      target: "19.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "37",
      source: "22.0",
      target: "20.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "38",
      source: "22.0",
      target: "21.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "47",
      source: "23.0",
      target: "11.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "46",
      source: "23.0",
      target: "12.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "39",
      source: "23.0",
      target: "16.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "40",
      source: "23.0",
      target: "17.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "41",
      source: "23.0",
      target: "18.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "42",
      source: "23.0",
      target: "19.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "43",
      source: "23.0",
      target: "20.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "44",
      source: "23.0",
      target: "21.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "45",
      source: "23.0",
      target: "22.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "49",
      source: "24.0",
      target: "11.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "48",
      source: "24.0",
      target: "23.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "52",
      source: "25.0",
      target: "11.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "51",
      source: "25.0",
      target: "23.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "50",
      source: "25.0",
      target: "24.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "54",
      source: "26.0",
      target: "11.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "55",
      source: "26.0",
      target: "16.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "53",
      source: "26.0",
      target: "24.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "56",
      source: "26.0",
      target: "25.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "57",
      source: "27.0",
      target: "11.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "58",
      source: "27.0",
      target: "23.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "60",
      source: "27.0",
      target: "24.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "59",
      source: "27.0",
      target: "25.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "61",
      source: "27.0",
      target: "26.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "62",
      source: "28.0",
      target: "11.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "63",
      source: "28.0",
      target: "27.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "66",
      source: "29.0",
      target: "11.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "64",
      source: "29.0",
      target: "23.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "65",
      source: "29.0",
      target: "27.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "67",
      source: "30.0",
      target: "23.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "69",
      source: "31.0",
      target: "11.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "70",
      source: "31.0",
      target: "23.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "71",
      source: "31.0",
      target: "27.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "68",
      source: "31.0",
      target: "30.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "72",
      source: "32.0",
      target: "11.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "73",
      source: "33.0",
      target: "11.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "74",
      source: "33.0",
      target: "27.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "75",
      source: "34.0",
      target: "11.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "76",
      source: "34.0",
      target: "29.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "77",
      source: "35.0",
      target: "11.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "79",
      source: "35.0",
      target: "29.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "78",
      source: "35.0",
      target: "34.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "82",
      source: "36.0",
      target: "11.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "83",
      source: "36.0",
      target: "29.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "80",
      source: "36.0",
      target: "34.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "81",
      source: "36.0",
      target: "35.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "87",
      source: "37.0",
      target: "11.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "88",
      source: "37.0",
      target: "29.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "84",
      source: "37.0",
      target: "34.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "85",
      source: "37.0",
      target: "35.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "86",
      source: "37.0",
      target: "36.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "93",
      source: "38.0",
      target: "11.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "94",
      source: "38.0",
      target: "29.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "89",
      source: "38.0",
      target: "34.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "90",
      source: "38.0",
      target: "35.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "91",
      source: "38.0",
      target: "36.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "92",
      source: "38.0",
      target: "37.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "95",
      source: "39.0",
      target: "25.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "96",
      source: "40.0",
      target: "25.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "97",
      source: "41.0",
      target: "24.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "98",
      source: "41.0",
      target: "25.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "101",
      source: "42.0",
      target: "24.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "100",
      source: "42.0",
      target: "25.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "99",
      source: "42.0",
      target: "41.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "102",
      source: "43.0",
      target: "11.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "103",
      source: "43.0",
      target: "26.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "104",
      source: "43.0",
      target: "27.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "106",
      source: "44.0",
      target: "11.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "105",
      source: "44.0",
      target: "28.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "107",
      source: "45.0",
      target: "28.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "108",
      source: "47.0",
      target: "46.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "112",
      source: "48.0",
      target: "11.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "110",
      source: "48.0",
      target: "25.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "111",
      source: "48.0",
      target: "27.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "109",
      source: "48.0",
      target: "47.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "114",
      source: "49.0",
      target: "11.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "113",
      source: "49.0",
      target: "26.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "116",
      source: "50.0",
      target: "24.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "115",
      source: "50.0",
      target: "49.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "119",
      source: "51.0",
      target: "11.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "118",
      source: "51.0",
      target: "26.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "117",
      source: "51.0",
      target: "49.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "121",
      source: "52.0",
      target: "39.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "120",
      source: "52.0",
      target: "51.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "122",
      source: "53.0",
      target: "51.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "125",
      source: "54.0",
      target: "26.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "124",
      source: "54.0",
      target: "49.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "123",
      source: "54.0",
      target: "51.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "131",
      source: "55.0",
      target: "11.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "132",
      source: "55.0",
      target: "16.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "133",
      source: "55.0",
      target: "25.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "130",
      source: "55.0",
      target: "26.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "128",
      source: "55.0",
      target: "39.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "134",
      source: "55.0",
      target: "41.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "135",
      source: "55.0",
      target: "48.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "127",
      source: "55.0",
      target: "49.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "126",
      source: "55.0",
      target: "51.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "129",
      source: "55.0",
      target: "54.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "136",
      source: "56.0",
      target: "49.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "137",
      source: "56.0",
      target: "55.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "139",
      source: "57.0",
      target: "41.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "140",
      source: "57.0",
      target: "48.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "138",
      source: "57.0",
      target: "55.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "145",
      source: "58.0",
      target: "11.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "143",
      source: "58.0",
      target: "27.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "142",
      source: "58.0",
      target: "48.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "141",
      source: "58.0",
      target: "55.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "144",
      source: "58.0",
      target: "57.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "148",
      source: "59.0",
      target: "48.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "147",
      source: "59.0",
      target: "55.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "149",
      source: "59.0",
      target: "57.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "146",
      source: "59.0",
      target: "58.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "150",
      source: "60.0",
      target: "48.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "151",
      source: "60.0",
      target: "58.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "152",
      source: "60.0",
      target: "59.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "153",
      source: "61.0",
      target: "48.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "158",
      source: "61.0",
      target: "55.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "157",
      source: "61.0",
      target: "57.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "154",
      source: "61.0",
      target: "58.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "156",
      source: "61.0",
      target: "59.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "155",
      source: "61.0",
      target: "60.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "164",
      source: "62.0",
      target: "41.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "162",
      source: "62.0",
      target: "48.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "159",
      source: "62.0",
      target: "55.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "163",
      source: "62.0",
      target: "57.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "160",
      source: "62.0",
      target: "58.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "161",
      source: "62.0",
      target: "59.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "166",
      source: "62.0",
      target: "60.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "165",
      source: "62.0",
      target: "61.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "168",
      source: "63.0",
      target: "48.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "174",
      source: "63.0",
      target: "55.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "170",
      source: "63.0",
      target: "57.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "171",
      source: "63.0",
      target: "58.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "167",
      source: "63.0",
      target: "59.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "173",
      source: "63.0",
      target: "60.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "172",
      source: "63.0",
      target: "61.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "169",
      source: "63.0",
      target: "62.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "184",
      source: "64.0",
      target: "11.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "177",
      source: "64.0",
      target: "48.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "175",
      source: "64.0",
      target: "55.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "183",
      source: "64.0",
      target: "57.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "179",
      source: "64.0",
      target: "58.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "182",
      source: "64.0",
      target: "59.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "181",
      source: "64.0",
      target: "60.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "180",
      source: "64.0",
      target: "61.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "176",
      source: "64.0",
      target: "62.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "178",
      source: "64.0",
      target: "63.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "187",
      source: "65.0",
      target: "48.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "194",
      source: "65.0",
      target: "55.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "193",
      source: "65.0",
      target: "57.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "189",
      source: "65.0",
      target: "58.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "192",
      source: "65.0",
      target: "59.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "191",
      source: "65.0",
      target: "60.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "190",
      source: "65.0",
      target: "61.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "188",
      source: "65.0",
      target: "62.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "185",
      source: "65.0",
      target: "63.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "186",
      source: "65.0",
      target: "64.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "200",
      source: "66.0",
      target: "48.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "196",
      source: "66.0",
      target: "58.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "197",
      source: "66.0",
      target: "59.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "203",
      source: "66.0",
      target: "60.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "202",
      source: "66.0",
      target: "61.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "198",
      source: "66.0",
      target: "62.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "201",
      source: "66.0",
      target: "63.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "195",
      source: "66.0",
      target: "64.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "199",
      source: "66.0",
      target: "65.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "204",
      source: "67.0",
      target: "57.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "206",
      source: "68.0",
      target: "11.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "207",
      source: "68.0",
      target: "24.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "205",
      source: "68.0",
      target: "25.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "208",
      source: "68.0",
      target: "27.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "210",
      source: "68.0",
      target: "41.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "209",
      source: "68.0",
      target: "48.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "213",
      source: "69.0",
      target: "11.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "214",
      source: "69.0",
      target: "24.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "211",
      source: "69.0",
      target: "25.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "215",
      source: "69.0",
      target: "27.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "217",
      source: "69.0",
      target: "41.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "216",
      source: "69.0",
      target: "48.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "212",
      source: "69.0",
      target: "68.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "221",
      source: "70.0",
      target: "11.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "222",
      source: "70.0",
      target: "24.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "218",
      source: "70.0",
      target: "25.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "223",
      source: "70.0",
      target: "27.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "224",
      source: "70.0",
      target: "41.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "225",
      source: "70.0",
      target: "58.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "220",
      source: "70.0",
      target: "68.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "219",
      source: "70.0",
      target: "69.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "230",
      source: "71.0",
      target: "11.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "233",
      source: "71.0",
      target: "25.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "226",
      source: "71.0",
      target: "27.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "232",
      source: "71.0",
      target: "41.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "231",
      source: "71.0",
      target: "48.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "228",
      source: "71.0",
      target: "68.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "227",
      source: "71.0",
      target: "69.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "229",
      source: "71.0",
      target: "70.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "236",
      source: "72.0",
      target: "11.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "234",
      source: "72.0",
      target: "26.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "235",
      source: "72.0",
      target: "27.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "237",
      source: "73.0",
      target: "48.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "238",
      source: "74.0",
      target: "48.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "239",
      source: "74.0",
      target: "73.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "242",
      source: "75.0",
      target: "25.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "244",
      source: "75.0",
      target: "41.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "243",
      source: "75.0",
      target: "48.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "241",
      source: "75.0",
      target: "68.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "240",
      source: "75.0",
      target: "69.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "245",
      source: "75.0",
      target: "70.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "246",
      source: "75.0",
      target: "71.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "252",
      source: "76.0",
      target: "48.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "253",
      source: "76.0",
      target: "58.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "251",
      source: "76.0",
      target: "62.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "250",
      source: "76.0",
      target: "63.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "247",
      source: "76.0",
      target: "64.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "248",
      source: "76.0",
      target: "65.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
    {
      key: "249",
      source: "76.0",
      target: "66.0",
      attributes: { type: "arrow", label: "foobar", size: 4 },
    },
  ],
};

// Type and declare internal state:
interface State {
  hoveredNode?: string;
  searchQuery: string;

  // State derived from query:
  selectedNode?: string;
  suggestions?: Set<string>;

  // State derived from hovered node:
  hoveredNeighbors?: Set<string>;
}

export default Vue.extend({
  name: "LicenseGraph",
  store,
  router,
  props: {},
  components: {},
  computed: {
    ...mapState([]),
  },
  data() {
    return {
      inflight: false,
      data: {
        nodes: [],
        edges: [],
      },
    };
  },
  methods: {
    async loadData() {
      const activePackages = await primaryDataLoader.activePackages();

      const packageLabels = new Set(activePackages.map((x) => x.Label));

      const packageGraphData: GraphData = {
        nodes: activePackages.map((pkg) => ({
          key: pkg.Label,
          attributes: {
            size: 4,
            label: pkg.Label,
            color: "#cccccc",
          },
        })),
        edges: [],
      };

      for (const [i, pkg] of activePackages.entries()) {
        for (const [j, sourcePkgLabel] of pkg.SourcePackageLabels.split(",").entries()) {
          if (packageLabels.has(sourcePkgLabel)) {
            packageGraphData.edges.push({
              key: `${pkg.Label}::${j}`,
              source: sourcePkgLabel,
              target: pkg.Label,
              attributes: {
                size: 4,
                type: "arrow",
                label: "Source",
              },
            });
          }
        }
      }

      // this.$data.data = data;
      this.$data.data = packageGraphData;
    },
    async render() {
      this.$data.inflight = true;

      await this.loadData();

      // Taken from https://codesandbox.io/s/github/jacomyal/sigma.js/tree/main/examples/use-reducers

      // Examples: https://github.com/jacomyal/sigma.js/#installation

      // Retrieve some useful DOM elements:
      const container = document.getElementById("sigma-container") as HTMLElement;
      const searchInput = document.getElementById("search-input") as HTMLInputElement;
      // const searchSuggestions = document.getElementById("suggestions") as HTMLDataListElement;

      // Instantiate sigma:
      const graph = new Graph();
      // @ts-ignore
      graph.import(this.$data.data);

      // Arranges nodes in a circle
      // @ts-ignore
      // graph.nodes().forEach((node, i) => {
      //   // @ts-ignore
      //   const angle = (i * 2 * Math.PI) / graph.order;
      //   // @ts-ignore
      //   graph.setNodeAttribute(node, "x", 100 * Math.cos(angle) + 50);
      //   // @ts-ignore
      //   graph.setNodeAttribute(node, "y", 100 * Math.sin(angle) + 50);
      // });
      graph.nodes().forEach((node, i) => {
        // @ts-ignore
        graph.setNodeAttribute(node, "x", Math.random() * 2);
        // @ts-ignore
        graph.setNodeAttribute(node, "y", Math.random());
      });

      const renderer = new Sigma(graph, container);

      const state: State = { searchQuery: "" };

      const nodeEvents = [
        "enterNode",
        "leaveNode",
        "downNode",
        "clickNode",
        "rightClickNode",
        "doubleClickNode",
        "wheelNode",
      ] as const;
      const edgeEvents = [
        "downEdge",
        "clickEdge",
        "rightClickEdge",
        "doubleClickEdge",
        "wheelEdge",
      ] as const;
      const stageEvents = ["downStage", "clickStage", "doubleClickStage", "wheelStage"] as const;

      nodeEvents.forEach((eventType) =>
        renderer.on(eventType, ({ node }) => console.log(eventType, "node", node))
      );
      edgeEvents.forEach((eventType) =>
        renderer.on(eventType, ({ edge }) => console.log(eventType, "edge", edge))
      );

      this.$data.inflight = false;

      // Feed the datalist autocomplete values:
      // searchSuggestions.innerHTML = graph
      //   // @ts-ignore
      //   .nodes()
      //   // @ts-ignore
      //   .map((node) => `<option value="${graph.getNodeAttribute(node, "label")}"></option>`)
      //   .join("\n");

      // Actions:
      function setSearchQuery(query: string) {
        state.searchQuery = query;

        if (searchInput.value !== query) {
          searchInput.value = query;
        }

        if (query) {
          const lcQuery = query.toLowerCase();
          const suggestions = graph
            // @ts-ignore
            .nodes()
            // @ts-ignore
            .map((n: any) => ({ id: n, label: graph.getNodeAttribute(n, "label") as string }))
            .filter(({ label }: { label: any }) => label.toLowerCase().includes(lcQuery));

          // If we have a single perfect match, them we remove the suggestions, and
          // we consider the user has selected a node through the datalist
          // autocomplete:
          if (suggestions.length === 1 && suggestions[0].label === query) {
            state.selectedNode = suggestions[0].id;
            state.suggestions = undefined;

            // Move the camera to center it on the selected node:
            const nodePosition = renderer.getNodeDisplayData(state.selectedNode) as Coordinates;
            renderer.getCamera().animate(nodePosition, {
              duration: 500,
            });
          }
          // Else, we display the suggestions list:
          else {
            state.selectedNode = undefined;
            state.suggestions = new Set(suggestions.map(({ id }: { id: any }) => id));
          }
        }
        // If the query is empty, then we reset the selectedNode / suggestions state:
        else {
          state.selectedNode = undefined;
          state.suggestions = undefined;
        }

        // Refresh rendering:
        renderer.refresh();
      }

      function setHoveredNode(node?: string) {
        if (node) {
          state.hoveredNode = node;
          // @ts-ignore
          state.hoveredNeighbors = new Set(graph.neighbors(node));
        } else {
          state.hoveredNode = undefined;
          state.hoveredNeighbors = undefined;
        }

        // Refresh rendering:
        renderer.refresh();
      }

      // Bind search input interactions:
      searchInput.addEventListener("input", () => {
        setSearchQuery(searchInput.value || "");
      });
      searchInput.addEventListener("blur", () => {
        setSearchQuery("");
      });

      // Bind graph interactions:
      renderer.on("enterNode", ({ node }) => {
        setHoveredNode(node);
      });
      renderer.on("leaveNode", () => {
        setHoveredNode(undefined);
      });

      // Render nodes accordingly to the internal state:
      // 1. If a node is selected, it is highlighted
      // 2. If there is query, all non-matching nodes are greyed
      // 3. If there is a hovered node, all non-neighbor nodes are greyed
      renderer.setSetting("nodeReducer", (node, data) => {
        const res: Partial<NodeDisplayData> = { ...data };

        if (
          state.hoveredNeighbors &&
          !state.hoveredNeighbors.has(node) &&
          state.hoveredNode !== node
        ) {
          res.label = "";
          res.color = "#f6f6f6";
        }

        if (state.selectedNode === node) {
          res.highlighted = true;
        } else if (state.suggestions && !state.suggestions.has(node)) {
          res.label = "";
          res.color = "#f6f6f6";
        }

        return res;
      });

      // Render edges accordingly to the internal state:
      // 1. If a node is hovered, the edge is hidden if it is not connected to the
      //    node
      // 2. If there is a query, the edge is only visible if it connects two
      //    suggestions
      renderer.setSetting("edgeReducer", (edge, data) => {
        const res: Partial<EdgeDisplayData> = { ...data };

        // @ts-ignore
        if (state.hoveredNode && !graph.hasExtremity(edge, state.hoveredNode)) {
          res.hidden = true;
        }

        if (
          state.suggestions &&
          // @ts-ignore
          (!state.suggestions.has(graph.source(edge)) || !state.suggestions.has(graph.target(edge)))
        ) {
          res.hidden = true;
        }

        return res;
      });

      // Examples of override functions
      // https://github.com/jacomyal/sigma.js/blob/7b3a5ead355f7c54449002e6909a9af2eecae6db/demo/src/canvas-utils.ts#L34

      // Override options
      // https://github.com/jacomyal/sigma.js/blob/7b3a5ead355f7c54449002e6909a9af2eecae6db/src/settings.ts#L12
      renderer.setSetting(
        "hoverRenderer",
        (context: CanvasRenderingContext2D, data: PlainObject, settings: PlainObject) => {
          const size = settings.labelSize;
          const font = settings.labelFont;
          const weight = settings.labelWeight;
          const subLabelSize = size - 2;

          const label = data.label;
          const subLabel = data.tag !== "unknown" ? data.tag : "";
          const clusterLabel = data.clusterLabel;

          // Then we draw the label background
          context.beginPath();
          context.fillStyle = "#fff";
          context.shadowOffsetX = 0;
          context.shadowOffsetY = 2;
          context.shadowBlur = 8;
          context.shadowColor = "#000";

          context.font = `${weight} ${size}px ${font}`;
          const labelWidth = context.measureText(label).width;
          context.font = `${weight} ${subLabelSize}px ${font}`;
          const subLabelWidth = subLabel ? context.measureText(subLabel).width : 0;
          context.font = `${weight} ${subLabelSize}px ${font}`;
          const clusterLabelWidth = clusterLabel ? context.measureText(clusterLabel).width : 0;

          const textWidth = Math.max(labelWidth, subLabelWidth, clusterLabelWidth);

          const x = Math.round(data.x);
          const y = Math.round(data.y);
          const w = Math.round(textWidth + size / 2 + data.size + 3);
          const hLabel = Math.round(size / 2 + 4);
          const hSubLabel = subLabel ? Math.round(subLabelSize / 2 + 9) : 0;
          const hClusterLabel = Math.round(subLabelSize / 2 + 9);

          drawRoundRect(
            context,
            x,
            y - hSubLabel - 12,
            w,
            hClusterLabel + hLabel + hSubLabel + 12,
            5
          );
          context.closePath();
          context.fill();

          context.shadowOffsetX = 0;
          context.shadowOffsetY = 0;
          context.shadowBlur = 0;

          // And finally we draw the labels
          context.fillStyle = TEXT_COLOR;
          context.font = `${weight} ${size}px ${font}`;
          context.fillText(label, data.x + data.size + 3, data.y + size / 3);

          if (subLabel) {
            context.fillStyle = TEXT_COLOR;
            context.font = `${weight} ${subLabelSize}px ${font}`;
            context.fillText(subLabel, data.x + data.size + 3, data.y - (2 * size) / 3 - 2);
          }

          context.fillStyle = data.color;
          context.font = `${weight} ${subLabelSize}px ${font}`;
          context.fillText(
            clusterLabel,
            data.x + data.size + 3,
            data.y + size / 3 + 3 + subLabelSize
          );
        }
      );

      renderer.setSetting(
        "labelRenderer",
        (
          context: CanvasRenderingContext2D,
          data: PartialButFor<NodeDisplayData, "x" | "y" | "size" | "label" | "color">,
          settings: Settings
        ) => {
          if (!data.label) {
            return;
          }

          const size = settings.labelSize,
            font = settings.labelFont,
            weight = settings.labelWeight;

          context.font = `${weight} ${size}px ${font}`;
          const width = context.measureText(data.label).width + 8;

          context.fillStyle = "#ffffffcc";
          context.fillRect(data.x + data.size, data.y + size / 3 - 15, width, 20);

          context.fillStyle = "#000";
          context.fillText(data.label, data.x + data.size + 3, data.y + size / 3);
        }
      );

      // https://github.com/jacomyal/sigma.js/blob/main/examples/custom-rendering/index.ts
      // renderer.setSetting("nodeProgramClasses", {
      //   image: getNodeProgramImage(),
      // });
    },
  },
  async created() {},
  async mounted() {
    this.render();
  },
});
</script>

<style type="text/scss" lang="scss" scoped>
#sigma-container {
  width: 100%;
  height: 100%;
  // min-height: 55vh;
  margin: 0;
  padding: 0;
  overflow: hidden;
}
#search {
  position: absolute;
  right: 1em;
  top: 1em;
}
</style>
