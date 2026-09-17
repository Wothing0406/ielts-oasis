import { NextResponse } from 'next/server';

// Bộ nhớ tạm thời lưu trữ Ngọc Giản (3 slots)
interface MeowchaSaveSlot {
  slot_id: number;
  slot_name?: string;
  is_occupied: boolean;
  realm?: string;
  realm_idx?: number;
  title?: string;
  hp?: number;
  max_hp?: number;
  score?: number;
  words_slain?: number;
  band_idx?: number;
  talents?: Record<string, any>;
  updated_at?: string;
}

const memorySaves: Record<number, MeowchaSaveSlot> = {};

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: memorySaves,
      error: null
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      data: null,
      error: { code: 'FETCH_FAILED', message: err.message || 'Lỗi đọc Ngọc Giản' }
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const slotId = Number(body.slot_id || body.slotId || 1);

    const slotData: MeowchaSaveSlot = {
      slot_id: slotId,
      slot_name: body.slot_name || `Ngọc Giản ${slotId}`,
      is_occupied: true,
      realm: body.realm || "Luyện Khí",
      realm_idx: Number(body.realm_idx || 0),
      title: body.title || "Tiểu Miêu Kiếm Đồng",
      hp: Number(body.hp ?? 50),
      max_hp: Number(body.max_hp ?? 50),
      score: Number(body.score ?? 0),
      words_slain: Number(body.words_slain ?? 0),
      band_idx: Number(body.band_idx ?? 0),
      talents: body.talents || {},
      updated_at: new Date().toISOString()
    };

    memorySaves[slotId] = slotData;

    return NextResponse.json({
      success: true,
      data: slotData,
      error: null
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      data: null,
      error: { code: 'SAVE_FAILED', message: err.message || 'Lỗi ghi Ngọc Giản' }
    }, { status: 400 });
  }
}
