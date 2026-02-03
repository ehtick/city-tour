"use strict";

import { RoadNetwork } from "./../road_network.js";
import { BuildingsGenerator } from "./buildings_generator.js";
import { NeighborhoodGenerator } from "./neighborhood_generator.js";
import { NeighborhoodRoadNetworkGenerator } from "./neighborhood_road_network_generator.js";
import { RoadNetworkSimplifier } from "./road_network_simplifier.js";
import { ZonedBlockGenerator } from "./zoned_block_generator.js";
import { TerrainGenerator } from "./terrain/terrain_generator.js";

var WorldGenerator = (function() {
  var generate = function(config) {
    var terrain, neighborhoods, roadNetwork, zonedBlocks, buildings;
    var terrainConfig, roadConfig, zonedBlockConfig;

    var combinedStartTime, combinedEndTime;
    var terrainStartTime, terrainEndTime;
    var neighborhoodsStartTime, neighborhoodsEndTime;
    var roadStartTime, roadEndTime;
    var zonedBlocksStartTime, zonedBlocksEndTime;
    var buildingsStartTime, buildingsEndTime;
    var simplifierStartTime, simplifierEndTime;

    combinedStartTime = new Date();

    terrainConfig = {
      heightJitter: config.terrain.heightJitter,
      heightJitterDecay: config.terrain.heightJitterDecay,
      hillCount: config.terrain.hillCount,
      maxHillHeight: config.terrain.maxHillHeight,
      river: (Math.random() < config.terrain.probabilityOfRiver),
    };

    terrainStartTime = new Date();
    terrain = TerrainGenerator.generate(config.terrain.columnCount, config.terrain.rowCount, terrainConfig);
    terrainEndTime = new Date();

    neighborhoodsStartTime = new Date();
    neighborhoods = NeighborhoodGenerator.generate(terrain, config.neighborhoods.count);
    neighborhoodsEndTime = new Date();

    roadStartTime = new Date();
    if (config.roadNetwork.isPresent !== true || neighborhoods.length < 1) {
      roadNetwork = new RoadNetwork(terrain);
    }
    else {
      roadConfig = {
        neighborhoods: {
          columnCount: config.neighborhoods.columnCount,
          rowCount: config.neighborhoods.rowCount,
        },
        safeFromDecayBlocks: config.roadNetwork.safeFromDecayBlocks,
        maxRoadAngle: config.roadNetwork.maxRoadAngle,
      };

      roadNetwork = NeighborhoodRoadNetworkGenerator.generate(terrain, neighborhoods, roadConfig);
    }
    roadEndTime = new Date();

    zonedBlockConfig = {
      blockDistanceDecayBegins: config.zonedBlocks.blockDistanceDecayBegins,
      maxBuildingStories: config.zonedBlocks.maxBuildingStories,
    };

    zonedBlocksStartTime = new Date();
    zonedBlocks;
    if (config.zonedBlocks.isPresent !== true) {
      // An empty road network should result in there being no zoned blocks, and therefore no buildings
      zonedBlocks = ZonedBlockGenerator.generate(terrain, neighborhoods, RoadNetwork(terrain), zonedBlockConfig);
    }
    else {
      zonedBlocks = ZonedBlockGenerator.generate(terrain, neighborhoods, roadNetwork, zonedBlockConfig);
    }
    zonedBlocksEndTime = new Date();
    buildingsStartTime = new Date();
    buildings = BuildingsGenerator.generate(terrain, zonedBlocks);
    buildingsEndTime = new Date();

    simplifierStartTime = new Date();
    //RoadNetworkSimplifier.simplify(roadNetwork, buildings);
    simplifierEndTime = new Date();

    combinedEndTime = new Date();

    console.log("Time to generate world data: " + (combinedEndTime - combinedStartTime) + "ms");
    console.log("  Terrain:       " + (terrainEndTime - terrainStartTime) + "ms");
    console.log("  Neighborhoods: " + (neighborhoodsEndTime - neighborhoodsStartTime) + "ms");
    console.log("  Road Network:  " + (roadEndTime - roadStartTime) + "ms");
    console.log("  Lots:          " + (zonedBlocksEndTime - zonedBlocksStartTime) + "ms");
    console.log("  Buildings:     " + (buildingsEndTime - buildingsStartTime) + "ms");
    console.log("  Road network simplification: " + (simplifierEndTime - simplifierStartTime) + "ms");

    return {
      terrain: terrain,
      roadNetwork: roadNetwork,
      buildings: buildings,
      neighborhoods: neighborhoods,
    };
  };

  return {
    generate: generate,
  };
})();

export { WorldGenerator };
