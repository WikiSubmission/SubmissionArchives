"""Build the animated Submission Archives banner used by README.md."""

from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps


ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "assets" / "readme" / "submission-archives-banner.gif"
LOGO_PATH = ROOT / "public" / "submission-logo.png"
SERIF_BOLD = ROOT / "public" / "fonts" / "LTSuperiorSerif-Bold.otf"
SERIF_REGULAR = ROOT / "public" / "fonts" / "LTSuperiorSerif-Regular.otf"
SANS_REGULAR = ROOT / "public" / "fonts" / "GlacialIndifference-Regular.ttf"

WIDTH = 1400
HEIGHT = 500
FRAME_COUNT = 54
FRAME_DURATION_MS = 85

INK = "#181512"
INK_RAISED = "#201c18"
CREAM = "#eee3ce"
CREAM_MUTED = "#a99d89"
RUST = "#a95835"
RUST_SOFT = "#c4784d"
RULE = "#554a3e"


def clamp(value: float, minimum: float = 0.0, maximum: float = 1.0) -> float:
    return max(minimum, min(maximum, value))


def ease_out_quart(value: float) -> float:
    value = clamp(value)
    return 1 - (1 - value) ** 4


def mix_color(start: str, end: str, amount: float) -> tuple[int, int, int]:
    amount = clamp(amount)
    start_rgb = tuple(int(start[index:index + 2], 16) for index in (1, 3, 5))
    end_rgb = tuple(int(end[index:index + 2], 16) for index in (1, 3, 5))
    return tuple(round(a + (b - a) * amount) for a, b in zip(start_rgb, end_rgb))


def draw_tracked_text(
    draw: ImageDraw.ImageDraw,
    position: tuple[int, int],
    text: str,
    font: ImageFont.FreeTypeFont,
    fill: str | tuple[int, int, int],
    tracking: int,
) -> None:
    x, y = position
    for character in text:
        draw.text((x, y), character, font=font, fill=fill)
        x += round(draw.textlength(character, font=font)) + tracking


def paste_synthetic_italic(
    image: Image.Image,
    position: tuple[int, int],
    text: str,
    font: ImageFont.FreeTypeFont,
    fill: str,
    shear: float = 0.2,
) -> None:
    """Render a right-leaning italic while keeping the repository-local serif."""
    bounds = font.getbbox(text)
    padding = 12
    width = bounds[2] - bounds[0] + padding * 2
    height = bounds[3] - bounds[1] + padding * 2
    slant = round(height * shear)

    glyph = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    glyph_draw = ImageDraw.Draw(glyph)
    glyph_draw.text(
        (padding - bounds[0], padding - bounds[1]),
        text,
        font=font,
        fill=fill,
    )
    italic = glyph.transform(
        (width + slant, height),
        Image.Transform.AFFINE,
        (1, shear, -slant, 0, 1, 0),
        resample=Image.Resampling.BICUBIC,
    )
    paste_position = (
        position[0] + bounds[0] - padding,
        position[1] + bounds[1] - padding,
    )
    image.paste(italic, paste_position, italic)


def prepare_logo() -> Image.Image:
    source = Image.open(LOGO_PATH).convert("RGBA")
    alpha = source.getchannel("A")
    grayscale = ImageOps.grayscale(source)
    tinted = ImageOps.colorize(grayscale, black="#5c2c20", white=CREAM)
    tinted.putalpha(alpha)
    tinted.thumbnail((220, 220), Image.Resampling.LANCZOS)
    return tinted


def line_progress(frame_index: int, delay: int, duration: int = 8) -> float:
    return ease_out_quart((frame_index - delay) / duration)


def draw_partial_line(
    draw: ImageDraw.ImageDraw,
    start: tuple[int, int],
    end: tuple[int, int],
    progress: float,
    fill: str | tuple[int, int, int],
    width: int = 2,
) -> None:
    progress = clamp(progress)
    current = (
        round(start[0] + (end[0] - start[0]) * progress),
        round(start[1] + (end[1] - start[1]) * progress),
    )
    draw.line((start, current), fill=fill, width=width)


def draw_node(
    draw: ImageDraw.ImageDraw,
    point: tuple[int, int],
    label: str,
    progress: float,
    font: ImageFont.FreeTypeFont,
    label_offset: tuple[int, int],
) -> None:
    if progress <= 0:
        return
    radius = max(2, round(7 * ease_out_quart(progress)))
    x, y = point
    draw.ellipse((x - radius, y - radius, x + radius, y + radius), outline=CREAM, width=2)
    inner_radius = max(1, radius - 4)
    draw.ellipse(
        (x - inner_radius, y - inner_radius, x + inner_radius, y + inner_radius),
        fill=RUST_SOFT,
    )
    label_color = mix_color(INK_RAISED, CREAM_MUTED, progress)
    draw_tracked_text(
        draw,
        (x + label_offset[0], y + label_offset[1]),
        label,
        font,
        label_color,
        2,
    )


def point_on_segment(start: tuple[int, int], end: tuple[int, int], amount: float) -> tuple[int, int]:
    return (
        round(start[0] + (end[0] - start[0]) * amount),
        round(start[1] + (end[1] - start[1]) * amount),
    )


def build_frame(
    frame_index: int,
    logo: Image.Image,
    fonts: dict[str, ImageFont.FreeTypeFont],
) -> Image.Image:
    image = Image.new("RGB", (WIDTH, HEIGHT), INK)
    draw = ImageDraw.Draw(image)

    draw.rectangle((12, 12, WIDTH - 13, HEIGHT - 13), outline=RULE, width=1)
    draw.line((42, 62, 742, 62), fill=RULE, width=1)
    draw.line((790, 62, WIDTH - 42, 62), fill=RULE, width=1)

    draw_tracked_text(draw, (45, 39), "DIGITAL RESEARCH ARCHIVE", fonts["label"], RUST_SOFT, 3)
    draw_tracked_text(draw, (793, 39), "ONE CORPUS  •  MANY FORMATS", fonts["label"], CREAM_MUTED, 2)

    image.paste(logo, (55, 124), logo)
    draw.text((291, 128), "SUBMISSION", font=fonts["title"], fill=CREAM)
    paste_synthetic_italic(image, (291, 205), "ARCHIVES", fonts["title"], RUST_SOFT)
    draw.text(
        (296, 299),
        "An enduring digital reading room for the preserved record.",
        font=fonts["subtitle"],
        fill=CREAM_MUTED,
    )
    draw_tracked_text(
        draw,
        (297, 353),
        "PRESERVE  •  SEARCH  •  READ  •  LISTEN  •  VERIFY",
        fonts["label"],
        CREAM,
        1,
    )

    center = (1070, 250)
    nodes = [
        ((919, 124), "QUR'AN", 4, (-82, -20)),
        ((1226, 126), "AUDIO", 11, (18, -20)),
        ((912, 376), "VIDEO", 18, (-75, 12)),
        ((1234, 374), "WRITTEN", 25, (18, 12)),
    ]

    fade_out = 1 - ease_out_quart((frame_index - 48) / 5)
    graph_color = mix_color(INK_RAISED, CREAM_MUTED, fade_out)
    center_progress = line_progress(frame_index, 1, 6) * fade_out

    if center_progress > 0:
        pulse = 1 + 2 * (0.5 + 0.5 * math.sin(frame_index * 0.62))
        radius = round(12 + pulse)
        draw.ellipse(
            (center[0] - radius, center[1] - radius, center[0] + radius, center[1] + radius),
            outline=graph_color,
            width=2,
        )
        draw.ellipse(
            (center[0] - 5, center[1] - 5, center[0] + 5, center[1] + 5),
            fill=RUST_SOFT,
        )
        draw_tracked_text(
            draw,
            (center[0] - 89, center[1] + 27),
            "SEARCHABLE ARCHIVE",
            fonts["label"],
            graph_color,
            2,
        )

    progresses: list[float] = []
    for point, label, delay, label_offset in nodes:
        progress = line_progress(frame_index, delay, 9) * fade_out
        progresses.append(progress)
        draw_partial_line(draw, center, point, progress, graph_color)
        draw_node(draw, point, label, progress, fonts["node"], label_offset)

    if frame_index >= 34 and fade_out > 0:
        route_index = ((frame_index - 34) / 14) * len(nodes)
        segment_index = min(len(nodes) - 1, int(route_index))
        segment_amount = route_index - segment_index
        target = nodes[segment_index][0]
        if segment_index % 2 == 0:
            moving_point = point_on_segment(center, target, segment_amount)
        else:
            moving_point = point_on_segment(target, center, segment_amount)
        dot_radius = 4
        draw.ellipse(
            (
                moving_point[0] - dot_radius,
                moving_point[1] - dot_radius,
                moving_point[0] + dot_radius,
                moving_point[1] + dot_radius,
            ),
            fill=CREAM,
        )

    draw_tracked_text(draw, (45, 448), "ARCHIVE.WIKISUBMISSION.ORG", fonts["label"], CREAM_MUTED, 2)
    draw_tracked_text(draw, (1127, 448), "GOD ALONE", fonts["label"], RUST_SOFT, 3)
    return image


def main() -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    logo = prepare_logo()
    fonts = {
        "title": ImageFont.truetype(SERIF_BOLD, 74),
        "subtitle": ImageFont.truetype(SERIF_REGULAR, 23),
        "label": ImageFont.truetype(SANS_REGULAR, 12),
        "node": ImageFont.truetype(SANS_REGULAR, 13),
    }

    frames = [build_frame(index, logo, fonts) for index in range(FRAME_COUNT)]
    palette = frames[-8].quantize(colors=96, method=Image.Quantize.MEDIANCUT)
    indexed_frames = [frame.quantize(palette=palette) for frame in frames]
    indexed_frames[0].save(
        OUTPUT,
        save_all=True,
        append_images=indexed_frames[1:],
        duration=FRAME_DURATION_MS,
        loop=0,
        optimize=True,
        disposal=1,
    )
    print(f"Wrote {OUTPUT.relative_to(ROOT)} ({OUTPUT.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
