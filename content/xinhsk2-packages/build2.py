# -*- coding: utf-8 -*-
"""lNN_src.py → FLAT багц. Нэг build бүх 新HSK教程 түвшинд: ../xinhsk3-packages/build2.py (LEVEL-ийг COURSE_ID-аас авна).
Хэрэглээ: cd content/xinhskN-packages && python3 build2.py lNN_src xinhskN-lNN"""
import os, runpy, sys
runpy.run_path(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "xinhsk3-packages", "build2.py"), run_name="__main__")
