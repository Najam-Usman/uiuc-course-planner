from __future__ import annotations
import json
from pathlib import Path
import click

# Support both module and direct execution
try:
    from .parser import parse  # preferred
except ImportError:
    import sys, os
    pkg_root = os.path.dirname(os.path.dirname(__file__))
    if pkg_root not in sys.path:
        sys.path.insert(0, pkg_root)
    from audit_parser.parser import parse  # type: ignore


@click.group()
def cli():
    pass


@cli.command(help="Parse a UIUC Audit PDF and emit JSON.")
@click.argument("pdf_path", type=click.Path(exists=True, dir_okay=False))
@click.option("-o", "--out", "out_path", type=click.Path(dir_okay=False), default="-", help="Output JSON path (default: stdout)")
@click.option("--debug", is_flag=True, help="Print basic debugging info to stderr.")
@click.option("--keep-pii", is_flag=True, help="Include a hash of Student ID if present. Off by default.")
def parse_cmd(pdf_path: str, out_path: str, debug: bool, keep_pii: bool):
    pa = parse(pdf_path, debug=debug, keep_pii=keep_pii)
    payload = pa.to_dict()
    txt = json.dumps(payload, indent=2, ensure_ascii=False)
    if out_path == "-" or out_path is None:
        print(txt)
    else:
        Path(out_path).write_text(txt, encoding="utf-8")
        click.echo(f"Wrote {out_path}")


if __name__ == "__main__":
    cli()
