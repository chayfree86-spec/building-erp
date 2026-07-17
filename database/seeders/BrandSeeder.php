<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Brand;

class BrandSeeder extends Seeder
{
    public function run(): void
    {
        $brands = [
            ['name' => 'UltraTech Cement',    'description' => 'Indias largest cement manufacturer', 'status' => 'active'],
            ['name' => 'ACC Cement',          'description' => 'ACC Limited - trusted cement brand', 'status' => 'active'],
            ['name' => 'Birla Shakti',        'description' => 'Birla Shakti cement',               'status' => 'active'],
            ['name' => 'Tata Tiscon',         'description' => 'Tata Steel TMT bars',                'status' => 'active'],
            ['name' => 'JSW Steel',           'description' => 'JSW Neosteel TMT bars',              'status' => 'active'],
            ['name' => 'Asian Paints',        'description' => 'Paints, primers, putty, waterproofing', 'status' => 'active'],
            ['name' => 'Berger Paints',       'description' => 'Exterior & interior paints',          'status' => 'active'],
            ['name' => 'Supreme Pipes',       'description' => 'PVC, CPVC, UPVC pipes & fittings',   'status' => 'active'],
            ['name' => 'Finolex',             'description' => 'Electrical wires, cables, pipes',     'status' => 'active'],
            ['name' => 'Hindware',            'description' => 'Sanitaryware & plumbing solutions',   'status' => 'active'],
            ['name' => 'Kajaria',             'description' => 'Ceramic & vitrified tiles',           'status' => 'active'],
            ['name' => 'Somany',              'description' => 'Tiles, sanitaryware, bath fittings',  'status' => 'active'],
            ['name' => 'CenturyPly',          'description' => 'Plywood, laminates, MDF, blockboards', 'status' => 'active'],
            ['name' => 'Greenply',            'description' => 'Plywood, veneers, flush doors',        'status' => 'active'],
            ['name' => 'Godrej',              'description' => 'Locks, hardware, furniture fittings',  'status' => 'active'],
            ['name' => 'Everest',             'description' => 'Roofing sheets & building solutions',  'status' => 'active'],
            ['name' => 'Dr. Fixit',           'description' => 'Waterproofing & construction chemicals','status' => 'active'],
            ['name' => 'Sika',                'description' => 'Adhesives, sealants, waterproofing',   'status' => 'active'],
            ['name' => 'Apollo Pipes',        'description' => 'PVC, CPVC, HDPE pipes',                'status' => 'active'],
            ['name' => 'Anchor',              'description' => 'Electrical switches, MCBs, accessories','status' => 'active'],
        ];

        foreach ($brands as $brand) {
            Brand::firstOrCreate(['name' => $brand['name']], $brand);
        }
    }
}
