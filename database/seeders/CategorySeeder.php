<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;
use App\Models\Unit;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $pcs = Unit::where('short_name', 'Pcs')->first()?->id;
        $kg  = Unit::where('short_name', 'Kg')->first()?->id;
        $ft  = Unit::where('short_name', 'Ft')->first()?->id;
        $sqft = Unit::where('short_name', 'Sq.Ft')->first()?->id;
        $bag = Unit::where('short_name', 'Bag')->first()?->id;
        $ton = Unit::where('short_name', 'Ton')->first()?->id;
        $mtr = Unit::where('short_name', 'Mtr')->first()?->id;
        $cuft = Unit::where('short_name', 'Cu.Ft')->first()?->id;
        $ltr = Unit::where('short_name', 'Ltr')->first()?->id;
        $bdl = Unit::where('short_name', 'Bdl')->first()?->id;

        $categories = [
            ['name' => 'Cement',          'unit_id' => $bag,  'description' => 'Cement bags (PPC, OPC, PSC)',               'status' => 'active'],
            ['name' => 'Steel / TMT Bars', 'unit_id' => $ton,  'description' => 'TMT bars, rebars, and structural steel',   'status' => 'active'],
            ['name' => 'Bricks & Blocks',  'unit_id' => $pcs,  'description' => 'Clay bricks, fly-ash bricks, AAC blocks',   'status' => 'active'],
            ['name' => 'Sand & Aggregates', 'unit_id' => $cuft, 'description' => 'River sand, M-sand, 10mm/20mm aggregates', 'status' => 'active'],
            ['name' => 'Pipes & Fittings', 'unit_id' => $mtr,  'description' => 'PVC, CPVC, GI pipes and fittings',          'status' => 'active'],
            ['name' => 'Paints & Coatings', 'unit_id' => $ltr, 'description' => 'Interior, exterior paints, primers, putty', 'status' => 'active'],
            ['name' => 'Plywood & Boards', 'unit_id' => $sqft, 'description' => 'Plywood sheets, MDF, particle boards',       'status' => 'active'],
            ['name' => 'Tiles & Marbles',  'unit_id' => $sqft, 'description' => 'Ceramic tiles, vitrified, marble, granite', 'status' => 'active'],
            ['name' => 'Electrical',       'unit_id' => $pcs,  'description' => 'Wires, switches, MCBs, distribution boards', 'status' => 'active'],
            ['name' => 'Plumbing',         'unit_id' => $pcs,  'description' => 'Sanitaryware, faucets, cisterns',           'status' => 'active'],
            ['name' => 'Hardware',         'unit_id' => $pcs,  'description' => 'Nails, screws, bolts, hinges, locks',       'status' => 'active'],
            ['name' => 'Doors & Windows',  'unit_id' => $pcs,  'description' => 'Wooden doors, UPVC windows, frames',        'status' => 'active'],
            ['name' => 'Roofing Sheets',   'unit_id' => $ft,   'description' => 'GI sheets, polycarbonate, asbestos sheets', 'status' => 'active'],
            ['name' => 'Adhesives',        'unit_id' => $kg,   'description' => 'Tile adhesive, white cement, epoxy',        'status' => 'active'],
            ['name' => 'Waterproofing',    'unit_id' => $kg,   'description' => 'Waterproofing compounds and membranes',     'status' => 'active'],
        ];

        foreach ($categories as $cat) {
            Category::firstOrCreate(['name' => $cat['name']], $cat);
        }
    }
}
