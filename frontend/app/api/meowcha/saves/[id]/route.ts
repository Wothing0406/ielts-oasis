import { NextResponse } from 'next/server';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const slotId = parseInt(params.id, 10);
    return NextResponse.json({
      success: true,
      data: { slot_id: slotId, deleted: true },
      error: null
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      data: null,
      error: { code: 'DELETE_FAILED', message: err.message || 'Lỗi xóa Ngọc Giản' }
    }, { status: 400 });
  }
}
