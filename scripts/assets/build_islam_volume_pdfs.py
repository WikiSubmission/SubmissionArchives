"""Build web-sized public PDFs for the later issues of ISLAM Volume 1.

The archival source scans are several hundred megabytes each. This script
preserves every page and its original placement while resizing and recompressing
the page images for practical browser delivery. Source parts 3 and 4 belong to
the same combined journal issue and are written to one public PDF in that order.
"""

from __future__ import annotations

import gc
from pathlib import Path

from PIL import Image
from pypdf import PdfReader, PdfWriter


ROOT = Path(__file__).resolve().parents[2]
SOURCE_DIR = ROOT / "data" / "sources" / "books" / "islam_volumes" / "pdfs"
PUBLIC_DIR = ROOT / "public" / "content" / "written" / "books"
MAX_IMAGE_SIZE = (1500, 2000)
JPEG_QUALITY = 82


def add_optimized_pages(writer: PdfWriter, source_path: Path) -> int:
    reader = PdfReader(source_path)
    page_count = len(reader.pages)

    for page_number, source_page in enumerate(reader.pages, start=1):
        writer.add_page(source_page)
        output_page = writer.pages[-1]

        for embedded_image in output_page.images:
            image = embedded_image.image
            if image.mode != "RGB":
                image = image.convert("RGB")
            image.thumbnail(MAX_IMAGE_SIZE, Image.Resampling.LANCZOS)
            embedded_image.replace(image, quality=JPEG_QUALITY)

        if page_number % 10 == 0 or page_number == page_count:
            print(f"  {source_path.name}: optimized {page_number}/{page_count} pages")
        gc.collect()

    return page_count


def build_pdf(source_names: list[str], output_name: str, title: str) -> None:
    output_path = PUBLIC_DIR / output_name
    temporary_path = output_path.with_suffix(".building.pdf")
    writer = PdfWriter()
    total_pages = 0

    for source_name in source_names:
        total_pages += add_optimized_pages(writer, SOURCE_DIR / source_name)

    writer.add_metadata({"/Title": title})
    with temporary_path.open("wb") as output_file:
        writer.write(output_file)
    temporary_path.replace(output_path)
    print(f"Wrote {output_path.relative_to(ROOT)} ({total_pages} pages)")


def main() -> None:
    PUBLIC_DIR.mkdir(parents=True, exist_ok=True)
    build_pdf(
        ["1974 Islam 2.pdf"],
        "ISLAM - Volume 1, Number 2 (July 1974).pdf",
        "ISLAM - Volume 1, Number 2 (July 1974)",
    )
    build_pdf(
        ["1975 Islam 3.pdf", "1975 Islam 4.pdf"],
        "ISLAM - Volume 1, Number 3 & 4 (January 1975).pdf",
        "ISLAM - Volume 1, Number 3 & 4 (January 1975)",
    )


if __name__ == "__main__":
    main()
