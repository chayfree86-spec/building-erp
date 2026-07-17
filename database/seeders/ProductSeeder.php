<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Product;
use App\Models\Category;
use App\Models\Unit;
use App\Models\Brand;
use App\Models\GstRate;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $gst18 = GstRate::where('rate', 18)->first()?->id;
        $gst28 = GstRate::where('rate', 28)->first()?->id;
        $gst12 = GstRate::where('rate', 12)->first()?->id;
        $gst5  = GstRate::where('rate', 5)->first()?->id;

        $userId = 1; // Super Admin

        $products = [
            // Cement
            ['category' => 'Cement',        'brand' => 'UltraTech Cement', 'unit' => 'Bag',  'gst' => $gst28, 'name' => 'UltraTech PPC Cement 50kg',          'sku' => 'CEM-UT-001', 'hsn' => '252329', 'min_stock' => 50],
            ['category' => 'Cement',        'brand' => 'ACC Cement',      'unit' => 'Bag',  'gst' => $gst28, 'name' => 'ACC F2R Superfast Cement 50kg',       'sku' => 'CEM-AC-002', 'hsn' => '252329', 'min_stock' => 30],
            ['category' => 'Cement',        'brand' => 'Birla Shakti',    'unit' => 'Bag',  'gst' => $gst28, 'name' => 'Birla Shakti OPC 53 Grade 50kg',       'sku' => 'CEM-BS-003', 'hsn' => '252329', 'min_stock' => 40],

            // Steel
            ['category' => 'Steel / TMT Bars', 'brand' => 'Tata Tiscon',  'unit' => 'Ton',  'gst' => $gst18, 'name' => 'Tata Tiscon 500D TMT Bar 12mm',       'sku' => 'STL-TT-001', 'hsn' => '721420', 'min_stock' => 1],
            ['category' => 'Steel / TMT Bars', 'brand' => 'JSW Steel',    'unit' => 'Ton',  'gst' => $gst18, 'name' => 'JSW Neosteel 550D TMT Bar 16mm',      'sku' => 'STL-JS-002', 'hsn' => '721420', 'min_stock' => 1],
            ['category' => 'Steel / TMT Bars', 'brand' => 'Tata Tiscon',  'unit' => 'Ton',  'gst' => $gst18, 'name' => 'Tata Tiscon 500D TMT Bar 8mm',         'sku' => 'STL-TT-003', 'hsn' => '721420', 'min_stock' => 1],

            // Bricks
            ['category' => 'Bricks & Blocks', 'brand' => null,           'unit' => 'Pcs',  'gst' => $gst5,  'name' => 'Red Clay Brick 9x4x3 inch',              'sku' => 'BRK-CL-001', 'hsn' => '690100', 'min_stock' => 5000],
            ['category' => 'Bricks & Blocks', 'brand' => null,           'unit' => 'Pcs',  'gst' => $gst5,  'name' => 'Fly Ash Brick 12x6x4 inch',              'sku' => 'BRK-FA-002', 'hsn' => '690100', 'min_stock' => 3000],
            ['category' => 'Bricks & Blocks', 'brand' => null,           'unit' => 'Pcs',  'gst' => $gst12, 'name' => 'AAC Block 600x200x100mm',                'sku' => 'BRK-AC-003', 'hsn' => '681091', 'min_stock' => 500],

            // Sand & Aggregates
            ['category' => 'Sand & Aggregates','brand' => null,          'unit' => 'Cu.Ft','gst' => $gst5,  'name' => 'River Sand (Coarse)',                    'sku' => 'SND-RV-001', 'hsn' => '250510', 'min_stock' => 500],
            ['category' => 'Sand & Aggregates','brand' => null,          'unit' => 'Cu.Ft','gst' => $gst5,  'name' => 'M-Sand (Manufactured Sand)',             'sku' => 'SND-MS-002', 'hsn' => '250510', 'min_stock' => 500],
            ['category' => 'Sand & Aggregates','brand' => null,          'unit' => 'Cu.Ft','gst' => $gst5,  'name' => '20mm Crushed Aggregate (Kapchi)',         'sku' => 'AGG-20-003', 'hsn' => '251710', 'min_stock' => 300],

            // Paints
            ['category' => 'Paints & Coatings','brand' => 'Asian Paints', 'unit' => 'Ltr',  'gst' => $gst28, 'name' => 'Asian Paints Tractor Emulsion 20Ltr',     'sku' => 'PNT-AP-001', 'hsn' => '320910', 'min_stock' => 10],
            ['category' => 'Paints & Coatings','brand' => 'Berger Paints','unit' => 'Ltr',  'gst' => $gst28, 'name' => 'Berger WeatherCoat Exterior 20Ltr',       'sku' => 'PNT-BP-002', 'hsn' => '320910', 'min_stock' => 10],
            ['category' => 'Paints & Coatings','brand' => 'Asian Paints', 'unit' => 'Ltr',  'gst' => $gst28, 'name' => 'Asian Paints Royale Luxury 10Ltr',        'sku' => 'PNT-AP-003', 'hsn' => '320910', 'min_stock' => 5],

            // Pipes
            ['category' => 'Pipes & Fittings','brand' => 'Supreme Pipes', 'unit' => 'Mtr',  'gst' => $gst18, 'name' => 'Supreme PVC Pipe 4 inch (110mm) 3Mtr',    'sku' => 'PIP-SP-001', 'hsn' => '391723', 'min_stock' => 50],
            ['category' => 'Pipes & Fittings','brand' => 'Finolex',       'unit' => 'Mtr',  'gst' => $gst18, 'name' => 'Finolex CPVC Pipe 1/2 inch (15mm) 3Mtr', 'sku' => 'PIP-FN-002', 'hsn' => '391723', 'min_stock' => 100],

            // Tiles
            ['category' => 'Tiles & Marbles', 'brand' => 'Kajaria',       'unit' => 'Sq.Ft','gst' => $gst28, 'name' => 'Kajaria Vitrified Tile 600x600mm (4 pcs/box)', 'sku' => 'TIL-KJ-001', 'hsn' => '690721', 'min_stock' => 200],
            ['category' => 'Tiles & Marbles', 'brand' => 'Somany',        'unit' => 'Sq.Ft','gst' => $gst28, 'name' => 'Somany Ceramic Wall Tile 300x450mm',       'sku' => 'TIL-SM-002', 'hsn' => '690723', 'min_stock' => 100],

            // Plywood
            ['category' => 'Plywood & Boards','brand' => 'CenturyPly',    'unit' => 'Sq.Ft','gst' => $gst18, 'name' => 'CenturyPly MR Grade 8x4 ft (19mm)',        'sku' => 'PLY-CP-001', 'hsn' => '441231', 'min_stock' => 20],
            ['category' => 'Plywood & Boards','brand' => 'Greenply',      'unit' => 'Sq.Ft','gst' => $gst18, 'name' => 'Greenply BWR Marine Grade 8x4 ft (19mm)',  'sku' => 'PLY-GP-002', 'hsn' => '441231', 'min_stock' => 15],

            // Electrical
            ['category' => 'Electrical',      'brand' => 'Finolex',       'unit' => 'Pcs',  'gst' => $gst18, 'name' => 'Finolex 2.5 sq mm FR PVC Wire 90Mtr (Green)', 'sku' => 'ELE-FN-001', 'hsn' => '854449', 'min_stock' => 20],
            ['category' => 'Electrical',      'brand' => 'Anchor',        'unit' => 'Pcs',  'gst' => $gst18, 'name' => 'Anchor Roma 16A Switch 1-Way',             'sku' => 'ELE-AC-002', 'hsn' => '853650', 'min_stock' => 50],

            // Plumbing
            ['category' => 'Plumbing',        'brand' => 'Hindware',      'unit' => 'Pcs',  'gst' => $gst18, 'name' => 'Hindware Western WC with Flush Tank',     'sku' => 'PLM-HW-001', 'hsn' => '691010', 'min_stock' => 5],
            ['category' => 'Plumbing',        'brand' => 'Hindware',      'unit' => 'Pcs',  'gst' => $gst18, 'name' => 'Hindware Wash Basin 22x16 inch',            'sku' => 'PLM-HW-002', 'hsn' => '691010', 'min_stock' => 5],

            // Adhesives
            ['category' => 'Adhesives',       'brand' => 'Dr. Fixit',     'unit' => 'Kg',   'gst' => $gst18, 'name' => 'Dr. Fixit Tile Adhesive (Grey) 20kg Bag',   'sku' => 'ADH-DF-001', 'hsn' => '382440', 'min_stock' => 15],
            ['category' => 'Adhesives',       'brand' => 'Sika',          'unit' => 'Kg',   'gst' => $gst18, 'name' => 'Sika Ceram 250 Tile Adhesive 25kg Bag',     'sku' => 'ADH-SK-002', 'hsn' => '382440', 'min_stock' => 10],
        ];

        foreach ($products as $p) {
            $categoryId = Category::where('name', $p['category'])->first()?->id;
            $brandId    = $p['brand'] ? Brand::where('name', $p['brand'])->first()?->id : null;
            $unitId     = Unit::where('short_name', $p['unit'])->first()?->id;

            Product::firstOrCreate(
                ['sku' => $p['sku']],
                [
                    'category_id'  => $categoryId,
                    'brand_id'     => $brandId,
                    'unit_id'      => $unitId,
                    'gst_rate_id'  => $p['gst'],
                    'name'         => $p['name'],
                    'sku'          => $p['sku'],
                    'hsn_code'     => $p['hsn'],
                    'minimum_stock'=> $p['min_stock'],
                    'status'       => 'active',
                    'created_by'   => $userId,
                ]
            );
        }
    }
}
