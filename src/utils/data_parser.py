"""
数据解析模块，用于解析不同格式的名单文件。
"""
import csv
import json
import logging
import os
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Union

import pandas as pd
import requests

from ..config.constants import FileType, REQUEST_TIMEOUT


logger = logging.getLogger(__name__)


class DataParser:
    """
    数据解析类，用于从不同格式的文件中解析名单和权重数据。
    支持本地文件和远程URL。
    """
    
    @staticmethod
    def parse_file(file_path: str) -> Tuple[List[str], List[float]]:
        """
        根据文件类型解析文件，提取名单和权重
        
        Args:
            file_path: 文件路径或URL
            
        Returns:
            包含名单列表和权重列表的元组
        
        Raises:
            ValueError: 如果文件格式不支持或解析失败
            FileNotFoundError: 如果文件不存在
        """
        # 判断是本地文件还是远程URL
        if file_path.startswith(('http://', 'https://')):
            return DataParser._parse_remote_file(file_path)
        else:
            return DataParser._parse_local_file(file_path)
            
    @staticmethod
    def _parse_local_file(file_path: str) -> Tuple[List[str], List[float]]:
        """
        解析本地文件
        
        Args:
            file_path: 本地文件路径
            
        Returns:
            包含名单列表和权重列表的元组
            
        Raises:
            ValueError: 如果文件格式不支持或解析失败
            FileNotFoundError: 如果文件不存在
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"文件不存在: {file_path}")
            
        # 获取文件扩展名
        file_ext = os.path.splitext(file_path)[1].lower()
        
        # 根据扩展名选择解析方法
        if file_ext == '.csv':
            return DataParser._parse_csv(file_path)
        elif file_ext in ['.xlsx', '.xls']:
            return DataParser._parse_excel(file_path)
        elif file_ext == '.txt':
            return DataParser._parse_txt(file_path)
        elif file_ext == '.json':
            return DataParser._parse_json(file_path)
        else:
            # 尝试默认以CSV格式解析
            try:
                return DataParser._parse_csv(file_path)
            except Exception:
                raise ValueError(f"不支持的文件格式: {file_ext}")
    
    @staticmethod
    def _parse_remote_file(url: str) -> Tuple[List[str], List[float]]:
        """
        解析远程文件
        
        Args:
            url: 远程文件URL
            
        Returns:
            包含名单列表和权重列表的元组
            
        Raises:
            ValueError: 如果文件格式不支持或解析失败
            requests.exceptions.RequestException: 如果网络请求失败
        """
        try:
            # 发送请求获取文件内容
            response = requests.get(url, timeout=REQUEST_TIMEOUT)
            response.raise_for_status()  # 如果请求失败，抛出异常
            
            # 根据URL后缀猜测文件类型
            file_ext = os.path.splitext(url.split('?')[0])[1].lower()
            
            if file_ext == '.csv':
                # 解析CSV格式
                lines = response.text.splitlines()
                return DataParser._parse_csv_content(lines)
            elif file_ext in ['.xlsx', '.xls']:
                # 解析Excel格式
                import io
                return DataParser._parse_excel_content(io.BytesIO(response.content))
            elif file_ext == '.txt':
                # 解析文本格式
                lines = response.text.splitlines()
                return DataParser._parse_txt_content(lines)
            elif file_ext == '.json':
                # 解析JSON格式
                data = response.json()
                return DataParser._parse_json_content(data)
            else:
                # 尝试默认以CSV格式解析
                lines = response.text.splitlines()
                try:
                    return DataParser._parse_csv_content(lines)
                except Exception:
                    raise ValueError(f"无法解析远程文件格式: {url}")
                
        except requests.exceptions.RequestException as e:
            logger.error(f"获取远程文件失败: {url}, 错误: {str(e)}")
            raise
    
    @staticmethod
    def _parse_csv(file_path: str) -> Tuple[List[str], List[float]]:
        """
        解析CSV文件
        
        Args:
            file_path: CSV文件路径
            
        Returns:
            包含名单列表和权重列表的元组
        """
        try:
            # 读取CSV文件
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
            return DataParser._parse_csv_content(lines)
        except Exception as e:
            logger.error(f"解析CSV文件失败: {file_path}, 错误: {str(e)}")
            raise ValueError(f"解析CSV文件失败: {str(e)}")
    
    @staticmethod
    def _parse_csv_content(lines: List[str]) -> Tuple[List[str], List[float]]:
        """
        解析CSV内容
        
        Args:
            lines: CSV文件内容行列表
            
        Returns:
            包含名单列表和权重列表的元组
        """
        if not lines:
            return [], []
            
        reader = csv.reader(lines)
        rows = list(reader)
        
        if not rows:
            return [], []
            
        # 第一行是名字
        names = [row[0].strip() for row in rows if row and row[0].strip()]
        
        # 第二列是权重（如果存在）
        weights = []
        for row in rows:
            if len(row) >= 2 and row[1].strip():
                try:
                    weight = float(row[1].strip())
                    weights.append(weight if weight >= 0 else 0)
                except ValueError:
                    weights.append(1.0)  # 默认权重为1
            else:
                weights.append(1.0)  # 默认权重为1
                
        return names, weights
    
    @staticmethod
    def _parse_excel(file_path: str) -> Tuple[List[str], List[float]]:
        """
        解析Excel文件
        
        Args:
            file_path: Excel文件路径
            
        Returns:
            包含名单列表和权重列表的元组
        """
        try:
            return DataParser._parse_excel_content(file_path)
        except Exception as e:
            logger.error(f"解析Excel文件失败: {file_path}, 错误: {str(e)}")
            raise ValueError(f"解析Excel文件失败: {str(e)}")
    
    @staticmethod
    def _parse_excel_content(file_path_or_buffer: Union[str, "BytesIO"]) -> Tuple[List[str], List[float]]:
        """
        解析Excel内容
        
        Args:
            file_path_or_buffer: Excel文件路径或文件对象
            
        Returns:
            包含名单列表和权重列表的元组
        """
        # 读取Excel文件的第一个工作表
        df = pd.read_excel(file_path_or_buffer, sheet_name=0, header=None)
        
        if df.empty:
            return [], []
            
        # 第一列是名字
        names = df.iloc[:, 0].dropna().astype(str).tolist()
        
        # 第二列是权重（如果存在）
        weights = []
        if df.shape[1] >= 2:
            for i in range(len(names)):
                try:
                    if i < df.shape[0] and pd.notna(df.iloc[i, 1]):
                        weight = float(df.iloc[i, 1])
                        weights.append(weight if weight >= 0 else 0)
                    else:
                        weights.append(1.0)  # 默认权重为1
                except (ValueError, TypeError):
                    weights.append(1.0)  # 默认权重为1
        else:
            weights = [1.0] * len(names)  # 所有人默认权重为1
                
        return names, weights
    
    @staticmethod
    def _parse_txt(file_path: str) -> Tuple[List[str], List[float]]:
        """
        解析文本文件
        
        Args:
            file_path: 文本文件路径
            
        Returns:
            包含名单列表和权重列表的元组
        """
        try:
            # 读取文本文件
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
            return DataParser._parse_txt_content(lines)
        except Exception as e:
            logger.error(f"解析文本文件失败: {file_path}, 错误: {str(e)}")
            raise ValueError(f"解析文本文件失败: {str(e)}")
    
    @staticmethod
    def _parse_txt_content(lines: List[str]) -> Tuple[List[str], List[float]]:
        """
        解析文本内容
        
        Args:
            lines: 文本文件内容行列表
            
        Returns:
            包含名单列表和权重列表的元组
        """
        names = []
        weights = []
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # 检查行是否包含分隔符（空格、tab、逗号等）
            parts = None
            for sep in ['\t', ',', ' ']:
                if sep in line:
                    parts = line.split(sep, 1)
                    break
                    
            if parts and len(parts) >= 2:
                name = parts[0].strip()
                try:
                    weight = float(parts[1].strip())
                    if weight < 0:
                        weight = 0
                except ValueError:
                    weight = 1.0
            else:
                name = line
                weight = 1.0
                
            if name:
                names.append(name)
                weights.append(weight)
                
        return names, weights
    
    @staticmethod
    def _parse_json(file_path: str) -> Tuple[List[str], List[float]]:
        """
        解析JSON文件
        
        Args:
            file_path: JSON文件路径
            
        Returns:
            包含名单列表和权重列表的元组
        """
        try:
            # 读取JSON文件
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            return DataParser._parse_json_content(data)
        except Exception as e:
            logger.error(f"解析JSON文件失败: {file_path}, 错误: {str(e)}")
            raise ValueError(f"解析JSON文件失败: {str(e)}")
    
    @staticmethod
    def _parse_json_content(data: Union[List, Dict]) -> Tuple[List[str], List[float]]:
        """
        解析JSON内容
        
        Args:
            data: JSON数据
            
        Returns:
            包含名单列表和权重列表的元组
        """
        names = []
        weights = []
        
        # JSON可能是字典或列表格式
        if isinstance(data, list):
            for item in data:
                if isinstance(item, dict):
                    # 检查字典中是否有name和weight键
                    name = item.get('name') or item.get('名字') or item.get('姓名')
                    weight = item.get('weight') or item.get('权重') or item.get('概率')
                    
                    if name:
                        names.append(str(name))
                        try:
                            w = float(weight) if weight is not None else 1.0
                            weights.append(w if w >= 0 else 0)
                        except (ValueError, TypeError):
                            weights.append(1.0)
                elif isinstance(item, str):
                    # 如果是字符串列表，则权重都为1
                    names.append(item)
                    weights.append(1.0)
                    
        elif isinstance(data, dict):
            # 如果是字典，键为名字，值为权重
            for name, weight in data.items():
                names.append(name)
                try:
                    w = float(weight) if weight is not None else 1.0
                    weights.append(w if w >= 0 else 0)
                except (ValueError, TypeError):
                    weights.append(1.0)
                    
        return names, weights
