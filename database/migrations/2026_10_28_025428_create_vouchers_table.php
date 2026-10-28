<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('vouchers', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('code')->unique();
            $table->string('description')->nullable();
            $table->string('type'); // enum VoucherType: percent, fixed
            $table->unsignedInteger('value');
            $table->unsignedInteger('min_subtotal')->default(0);
            $table->unsignedInteger('max_discount')->nullable(); // batas potongan untuk tipe percent
            $table->unsignedInteger('quota')->nullable();        // null = tanpa batas
            $table->unsignedInteger('used_count')->default(0);
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->boolean('is_active')->default(true);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vouchers');
    }
};
