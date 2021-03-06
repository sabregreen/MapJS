'use strict';

const i18n = require('i18n');
const express = require('express');
const router = express.Router();

const InventoryItemId = require('../data/item.js');
const config = require('../config.json');
const map = require('../data/map.js');

router.get('/get_data', async function(req, res) {
    const data = await getData(req.query);
    res.json({ data: data });
});

router.post('/get_data', async function(req, res) {
    const data = await getData(req.body);
    res.json({ data: data });
});

async function getData(filter) {
    //console.log('Filter:', filter);
    const minLat = filter.min_lat;
    const maxLat = filter.max_lat;
    const minLon = filter.min_lon;
    const maxLon = filter.max_lon;
    const showGyms = filter.show_gyms || false;
    const showRaids = filter.show_raids || false;
    const showPokestops = filter.show_pokestops || false;
    const showQuests = filter.show_quests || false;
    const questFilterExclude = filter.quest_filter_exclude ? JSON.parse(filter.quest_filter_exclude || {}) : []; //string 
    const showPokemon = filter.show_pokemon || false;
    const pokemonFilterExclude = filter.pokemon_filter_exclude ? JSON.parse(filter.pokemon_filter_exclude || {}) : []; //int
    const pokemonFilterIV = filter.pokemon_filter_iv ? JSON.parse(filter.pokemon_filter_iv || {}) : []; //dictionary
    const raidFilterExclude = filter.raid_filter_exclude ? JSON.parse(filter.raid_filter_exclude || {}) : [];
    const gymFilterExclude = filter.gym_filter_exclude ? JSON.parse(filter.gym_filter_exclude || {}) : [];
    const pokestopFilterExclude = filter.pokestop_filter_exclude ? JSON.parse(filter.pokestop_filter_exclude || {}) : [];
    const spawnpointFilterExclude = filter.spawnpoint_filter_exclude ? JSON.parse(filter.spawnpoint_filter_exclude || {}) : [];
    const showSpawnpoints = filter.show_spawnpoints || false;
    const showCells = filter.show_cells || false;
    const showSubmissionPlacementCells = filter.show_submission_placement_cells || false;
    const showSubmissionTypeCells = filter.show_submission_type_cells || false;
    const showWeather = filter.show_weather || false;
    const showActiveDevices = filter.show_active_devices || false;
    const showPokemonFilter = filter.show_pokemon_filter || false;
    const showQuestFilter = filter.show_quest_filter || false;
    const showRaidFilter = filter.show_raid_filter || false;
    const showGymFilter = filter.show_gym_filter || false;
    const showPokestopFilter = filter.show_pokestop_filter || false;
    const showSpawnpointFilter = filter.show_spawnpoint_filter || false;
    const lastUpdate = filter.last_update || 0;
    if ((showGyms || showRaids || showPokestops || showPokemon || showSpawnpoints ||
        showCells || showSubmissionTypeCells || showSubmissionPlacementCells || showWeather) &&
        (minLat === null || maxLat === null || minLon === null || maxLon === null)) {
        //res.respondWithError(BadRequest);
        return;
    }

    // TOOD: get perms via req
    const permViewMap = true;
    const permShowLures = true;
    const permShowInvasions = true;
    const permShowIV = true;

    let data = {};
    if (showGyms || showRaids) {
        data['gyms'] = await map.getGyms(minLat, maxLat, minLon, maxLon, lastUpdate, !showGyms, showRaids, raidFilterExclude, gymFilterExclude);
    }
    if (showPokestops || showQuests) {
        data['pokestops'] = await map.getPokestops(minLat, maxLat, minLon, maxLon, lastUpdate, !showPokestops && showQuests, showQuests, permShowLures, permShowInvasions, questFilterExclude, pokestopFilterExclude);
    }
    if (showPokemon) {
        data['pokemon'] = await map.getPokemon(minLat, maxLat, minLon, maxLon, permShowIV, lastUpdate, pokemonFilterExclude, pokemonFilterIV);
    }
    if (showSpawnpoints) {
        data['spawnpoints'] = await map.getSpawnpoints(minLat, maxLat, minLon, maxLon, lastUpdate, spawnpointFilterExclude);
    }
    if (showActiveDevices) {
        data['active_devices'] = await map.getDevices();
    }
    if (showCells) {
        data['cells'] = await map.getS2Cells(minLat, maxLat, minLon, maxLon, lastUpdate);
    }
    if (showSubmissionPlacementCells) {
        data['submission_placement_cells'] = [];//result?.cells
        data['submission_placement_rings'] = [];//result?.rings
    }
    if (showSubmissionTypeCells) {
        data['submission_type_cells'] = [];
    }
    if (showWeather) {
        data['weather'] = await map.getWeather(minLat, maxLat, minLon, maxLon, lastUpdate);
    }

    if (permViewMap && showPokemonFilter) {
        const onString = i18n.__('filter_on');
        const offString = i18n.__('filter_off');
        const ivString = i18n.__('filter_iv');
    
        const pokemonTypeString = i18n.__('filter_pokemon');
        const generalTypeString = i18n.__('filter_general');
    
        const globalIV = i18n.__('filter_global_iv');
        const configureString = i18n.__('filter_configure');
        const andString = i18n.__('filter_and');
        const orString = i18n.__('filter_or');
    
        let pokemonData = [];

        if (permShowIV) {
            for (let i = 0; i <= 1; i++) {
                const id = i === 0 ? 'and' : 'or';
                const filter = `
                <div class="btn-group btn-group-toggle" data-toggle="buttons">
                    <label class="btn btn-sm btn-off select-button-new" data-id="${id}" data-type="pokemon-iv" data-info="off">
                        <input type="radio" name="options" id="hide" autocomplete="off">${offString}
                    </label>
                    <label class="btn btn-sm btn-on select-button-new" data-id="${id}" data-type="pokemon-iv" data-info="on">
                        <input type="radio" name="options" id="show" autocomplete="off">${onString}
                    </label>
                </div>
                `;
                const andOrString = i === 0 ? andString : orString;
                const size = `<button class="btn btn-sm btn-primary configure-button-new" "data-id="${id}" data-type="pokemon-iv" data-info="global-iv">${configureString}</button>`;
                pokemonData.push({
                    'id': {
                        'formatted': andOrString,
                        'sort': i
                    },
                    'name': globalIV,
                    'image': '-',
                    'filter': filter,
                    'size': size,
                    'type': generalTypeString
                });
            }
        }

        const bigKarpString = i18n.__("filter_big_karp");
        const tinyRatString = i18n.__("filter_tiny_rat");
        for (var i = 0; i <= 1; i++) {
            const id = i === 0 ? 'big_karp' : 'tiny_rat';            
            const filter = generateShowHideButtons(id, 'pokemon-size');
            const sizeString = i === 0 ? bigKarpString : tinyRatString;
            const size = generateSizeButtons(id, 'pokemon-size');            
            pokemonData.push({
                "id": {
                    "formatted": i,//String(format: "%03d", i),
                    "sort": i + 2
                },
                "name": sizeString,
                "image": `<img class="lazy_load" data-src="/img/pokemon/${(i == 0 ? 129 : 19)}.png" style="height:50px; width:50px;">`,
                "filter": filter,
                "size": size,
                "type": generalTypeString
            });
        }


        for (let i = 1; i <= config.map.maxPokemonId; i++) {
            let ivLabel = '';
            if (permShowIV) {
                ivLabel = `
                <label class="btn btn-sm btn-size select-button-new" data-id="${i}" data-type="pokemon" data-info="iv">
                    <input type="radio" name="options" id="iv" autocomplete="off">${ivString}
                </label>
                `;
            } else {
                ivLabel = '';
            }
            const filter = generateShowHideButtons(i, 'pokemon', ivLabel);
            const size = generateSizeButtons(i, 'pokemon');
            pokemonData.push({
                'id': {
                    'formatted': i,//String(format: "%03d", i),
                    'sort': i + 10
                },
                'name': i18n.__('poke_' + i),
                'image': `<img class="lazy_load" data-src="/img/pokemon/${i}.png" style="height:50px; width:50px;">`,
                'filter': filter,
                'size': size,
                'type': pokemonTypeString
            });
        }

        data['pokemon_filters'] = pokemonData;
    }

    if (permViewMap && showRaidFilter) {
        const generalString = i18n.__('filter_general');
        const raidLevelsString = i18n.__('filter_raid_levels');
        const pokemonString = i18n.__('filter_pokemon');

        const raidTimers = i18n.__('filter_raid_timers');
        let raidData = [];
        const filter = generateShowHideButtons('timers', 'raid-timers');
        const size = generateSizeButtons('timers', 'raid-timers');
        raidData.push({
            'id': {
                'formatted': 0,//String(format: "%03d", 0),
                'sort': 0
            },
            'name': raidTimers,
            'image': '<img class="lazy_load" data-src="/img/misc/timer.png" style="height:50px; width:50px;">',
            'filter': filter,
            'size': size,
            'type': generalString
        });

        //Level
        for (let i = 1; i <= 5; i++) {
            const raidLevel = i18n.__('filter_raid_level_' + i);
            const filter = generateShowHideButtons(i, 'raid-level');
            const size = generateSizeButtons(i, 'raid-level');
            raidData.push({
                'id': {
                    'formatted': i,//String(format: "%03d", i),
                    'sort': i
                },
                'name': raidLevel,
                'image': `<img class="lazy_load" data-src="/img/egg/${i}.png" style="height:50px; width:50px;">`,
                'filter': filter,
                'size': size,
                'type': raidLevelsString
            });
        }

        //Pokemon
        for (let i = 1; i <= config.map.maxPokemonId; i++) {
            const filter = generateShowHideButtons(i, 'raid-pokemon');
            const size = generateSizeButtons(i, 'raid-pokemon');
            raidData.push({
                'id': {
                    'formatted': i,//String(format: "%03d", i),
                    'sort': i+200
                },
                'name': i18n.__('poke_' + i),
                'image': `<img class="lazy_load" data-src="/img/pokemon/${i}.png" style="height:50px; width:50px;">`,
                'filter': filter,
                'size': size,
                'type': pokemonString
            });
        }
        data['raid_filters'] = raidData;
    }

    if (permViewMap && showGymFilter) {
        const gymTeamString = i18n.__('filter_gym_team');
        const gymOptionsString = i18n.__('filter_gym_options');
        const availableSlotsString = i18n.__('filter_gym_available_slots');
        let gymData = [];

        //Team
        for (let i = 0; i <= 3; i++) {
            const gymTeam = i18n.__('filter_gym_team_' + i);
            const filter = generateShowHideButtons(i, 'gym-team');
            const size = generateSizeButtons(i, 'gym-team');
            gymData.push({
                'id': {
                    'formatted': i,//String(format: "%03d", i),
                    'sort': i
                },
                'name': gymTeam,
                'image': `<img class="lazy_load" data-src="/img/gym/${i}_${i}.png" style="height:50px; width:50px;">`,
                'filter': filter,
                'size': size,
                'type': gymTeamString
            });
        }

        // EX raid eligible gyms
        const exFilter = generateShowHideButtons('ex', 'gym-ex');
        const exSize = generateSizeButtons('ex', 'gym-ex');
        gymData.push({
            'id': {
                'formatted': 5,//String(format: "%03d", 5), //Need a better way to display, new section?
                'sort': 5
            },
            'name': i18n.__('filter_raid_ex') ,
            'image': '<img class="lazy_load" data-src="/img/item/1403.png" style="height:50px; width:50px;">',
            'filter': exFilter,
            'size': exSize,
            'type': gymOptionsString
        });

        //Available slots
        for (let i = 0; i <= 6; i++) {
            const availableSlots = i18n.__('filter_gym_available_slots_' + i);
            const filter = generateShowHideButtons(i, 'gym-slots');
            const size = generateSizeButtons(i, 'gym-slots');
            const team = Math.round((Math.random() % 3) + 1);
            gymData.push({
                'id': {
                    'formatted': i,//String(format: "%03d", i),
                    'sort': i+100
                },
                'name': availableSlots,
                'image': `<img class="lazy_load" data-src="/img/gym/${(i == 6 ? 0 : team)}_${(6 - i)}.png" style="height:50px; width:50px;">`,
                'filter': filter,
                'size': size,
                'type': availableSlotsString
            });
        }
        data['gym_filters'] = gymData;
    }

    if (permViewMap && showQuestFilter) {
        const pokemonTypeString = i18n.__('filter_pokemon');
        const miscTypeString = i18n.__('filter_misc');
        const itemsTypeString = i18n.__('filter_items');
        let questData = [];

        // Misc
        for (let i = 1; i <= 3; i++) {
            let itemName = '';
            switch (i) {
            case 1:
                itemName = i18n.__('filter_stardust');
                break;
            case 2:
                itemName = i18n.__('filter_xp');
                break;
            default:
                itemName = i18n.__('filter_candy');
                break;
            }
            const filter = generateShowHideButtons(i, 'quest-misc');
            const size = generateSizeButtons(i, 'quest-misc');
            questData.push({
                'id': {
                    'formatted': i,//String(format: "%03d", i),
                    'sort': i
                },
                'name': itemName,
                'image': `<img class="lazy_load" data-src="/img/item/${-i}.png" style="height:50px; width:50px;">`,
                'filter': filter,
                'size': size,
                'type': miscTypeString
            });
        }

        // Items
        let itemI = 1;
        let keys = Object.keys(InventoryItemId);
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const itemId = InventoryItemId[key];
            const filter = generateShowHideButtons(itemId, 'quest-item');
            const size = generateSizeButtons(itemId, 'quest-item');
            questData.push({
                'id': {
                    'formatted': itemI,//String(format: "%03d", itemI),
                    'sort': itemI+100
                },
                'name': i18n.__('item_' + itemId) ,
                'image': `<img class="lazy_load" data-src="/img/item/${itemId}.png" style="height:50px; width:50px;">`,
                'filter': filter,
                'size': size,
                'type': itemsTypeString
            });
            itemI++;
        }

        // Pokemon
        for (let i = 1; i <= config.map.maxPokemonId; i++) {
            const filter = generateShowHideButtons(i, 'quest-pokemon');
            const size = generateSizeButtons(i, 'quest-pokemon');
            questData.push({
                'id': {
                    'formatted': i,//String(format: "%03d", i),
                    'sort': i + 200
                },
                'name': i18n.__('poke_' + i),
                'image': `<img class="lazy_load" data-src="/img/pokemon/${i}.png" style="height:50px; width:50px;">`,
                'filter': filter,
                'size': size,
                'type': pokemonTypeString
            });
        }
        data['quest_filters'] = questData;
    }

    if (permViewMap && showPokestopFilter) {
        const pokestopOptionsString = i18n.__('filter_pokestop_options');
        let pokestopData = [];

        const pokestopNormal = i18n.__('filter_pokestop_normal');
        const pokestopInvasion = i18n.__('filter_pokestop_invasion');
        const filter = generateShowHideButtons('normal', 'pokestop-normal');
        const size = generateSizeButtons('normal', 'pokestop-normal');
        pokestopData.push({
            'id': {
                'formatted': 0,//String(format: "%03d", 0),
                'sort': 0
            },
            'name': pokestopNormal,
            'image': '<img class="lazy_load" data-src="/img/pokestop/0.png" style="height:50px; width:50px;">',
            'filter': filter,
            'size': size,
            'type': pokestopOptionsString
        });

        for (let i = 1; i <= 4; i++) {
            const pokestopLure = i18n.__('filter_pokestop_lure_' + i);
            const filter = generateShowHideButtons(i, 'pokestop-lure');
            const size = generateSizeButtons(i, 'pokestop-lure');
            pokestopData.push({
                'id': {
                    'formatted': i,//String(format: "%03d", i),
                    'sort': i
                },
                'name': pokestopLure,
                'image': `<img class="lazy_load" data-src="/img/pokestop/${i}.png" style="height:50px; width:50px;">`,
                'filter': filter,
                'size': size,
                'type': pokestopOptionsString
            });
        }

        const trFilter = generateShowHideButtons('invasion', 'pokestop-invasion');
        const trSize = generateSizeButtons('invasion', 'pokestop-invasion');
        pokestopData.push({
            'id': {
                'formatted': 5,//String(format: "%03d", 5),
                'sort': 5
            },
            'name': pokestopInvasion,
            'image': '<img class="lazy_load" data-src="/img/pokestop/i0.png" style="height:50px; width:50px;">',
            'filter': trFilter,
            'size': trSize,
            'type': pokestopOptionsString
        });
        data['pokestop_filters'] = pokestopData;
    }

    if (permViewMap && showSpawnpointFilter) {
        const spawnpointOptionsString = i18n.__('filter_spawnpoint_options');
        const spawnpointWithTimerString = i18n.__('filter_spawnpoint_with_timer');
        const spawnpointWithoutTimerString = i18n.__('filter_spawnpoint_without_timer');

        let spawnpointData = [];
        let filter = generateShowHideButtons('no-timer', 'spawnpoint-timer');
        let size = generateSizeButtons('no-timer', 'spawnpoint-timer');
        spawnpointData.push({
            'id': {
                'formatted': 0,//String(format: "%03d", 0),
                'sort': 0
            },
            'name': spawnpointWithoutTimerString,
            'image': '<img class="lazy_load" data-src="/img/spawnpoint/0.png" style="height:50px; width:50px;">',
            'filter': filter,
            'size': size,
            'type': spawnpointOptionsString
        });

        filter = generateShowHideButtons('with-timer', 'spawnpoint-timer');
        size = generateSizeButtons('with-timer', 'spawnpoint-timer');
        spawnpointData.push({
            'id': {
                'formatted': 1,//String(format: "%03d", 1),
                'sort': 1
            },
            'name': spawnpointWithTimerString,
            'image': '<img class="lazy_load" data-src="/img/spawnpoint/1.png" style="height:50px; width:50px;">',
            'filter': filter,
            'size': size,
            'type': spawnpointOptionsString
        });
        data['spawnpoint_filters'] = spawnpointData;
    }

    return data;
}

function generateShowHideButtons(id, type, ivLabel = '') {
    const hideString = i18n.__('filter_hide');
    const showString = i18n.__('filter_show');
    const filter = `
    <div class="btn-group btn-group-toggle" data-toggle="buttons">
        <label class="btn btn-sm btn-off select-button-new" data-id="${id}" data-type="${type}" data-info="hide">
            <input type="radio" name="options" id="hide" autocomplete="off">${hideString}
        </label>
        <label class="btn btn-sm btn-on select-button-new" data-id="${id}" data-type="${type}" data-info="show">
            <input type="radio" name="options" id="show" autocomplete="off">${showString}
        </label>
        ${ivLabel}
    </div>
    `;
    return filter;
}

function generateSizeButtons(id, type) {
    const smallString = i18n.__('filter_small');
    const normalString = i18n.__('filter_normal');
    const largeString = i18n.__('filter_large');
    const hugeString = i18n.__('filter_huge');
    const size = `
    <div class="btn-group btn-group-toggle" data-toggle="buttons">
        <label class="btn btn-sm btn-size select-button-new" data-id="${id}" data-type="${type}" data-info="small">
            <input type="radio" name="options" id="hide" autocomplete="off">${smallString}
        </label>
        <label class="btn btn-sm btn-size select-button-new" data-id="${id}" data-type="${type}" data-info="normal">
            <input type="radio" name="options" id="show" autocomplete="off">${normalString}
        </label>
        <label class="btn btn-sm btn-size select-button-new" data-id="${id}" data-type="${type}" data-info="large">
            <input type="radio" name="options" id="show" autocomplete="off">${largeString}
        </label>
        <label class="btn btn-sm btn-size select-button-new" data-id="${id}" data-type="${type}" data-info="huge">
            <input type="radio" name="options" id="show" autocomplete="off">${hugeString}
        </label>
    </div>
    `;
    return size;
}

module.exports = router;